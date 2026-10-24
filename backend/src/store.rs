use std::sync::Mutex;

use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use chrono::{Duration, NaiveDate};
use rusqlite::{Connection, OptionalExtension, params};
use serde::Serialize;

use crate::validation::{self, ValidationError};

/// A list stays writable at least this long after it was created...
pub const MIN_LIFETIME_MONTHS: u32 = 12;
/// ...and at least this long after the last day of its latest vacation.
pub const GRACE_MONTHS: u32 = 1;

#[derive(Debug)]
pub enum StoreError {
    NotFound,
    Archived,
    Invalid(ValidationError),
    Db(rusqlite::Error),
}

impl From<rusqlite::Error> for StoreError {
    fn from(e: rusqlite::Error) -> Self {
        StoreError::Db(e)
    }
}

impl From<ValidationError> for StoreError {
    fn from(e: ValidationError) -> Self {
        StoreError::Invalid(e)
    }
}

#[derive(Serialize, Debug, Clone)]
pub struct Vacation {
    pub id: i64,
    pub start: NaiveDate,
    pub end: NaiveDate,
}

#[derive(Serialize, Debug, Clone)]
pub struct Person {
    pub id: i64,
    pub name: String,
    pub vacations: Vec<Vacation>,
}

#[derive(Serialize, Debug)]
pub struct Document {
    pub archived: bool,
    pub people: Vec<Person>,
}

pub struct Store {
    conn: Mutex<Connection>,
}

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    created_on TEXT NOT NULL,
    archived_at TEXT
);
CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE (document_id, name)
);
CREATE TABLE IF NOT EXISTS vacations (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    CHECK (start <= end)
);
CREATE INDEX IF NOT EXISTS vacations_person ON vacations(person_id);
";

/// 128 random bits from the OS, base64url encoded (22 chars).
pub fn new_document_id() -> String {
    let mut buf = [0u8; 16];
    getrandom::fill(&mut buf).expect("OS randomness unavailable");
    URL_SAFE_NO_PAD.encode(buf)
}

impl Store {
    pub fn open(path: &str) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(path)?;
        Self::init(conn)
    }

    pub fn open_in_memory() -> Result<Self, rusqlite::Error> {
        Self::init(Connection::open_in_memory()?)
    }

    fn init(conn: Connection) -> Result<Self, rusqlite::Error> {
        conn.pragma_update(None, "foreign_keys", true)?;
        let _ = conn.pragma_update(None, "journal_mode", "WAL");
        conn.busy_timeout(std::time::Duration::from_secs(5))?;
        conn.execute_batch(SCHEMA)?;
        Self::migrate(&conn)?;
        Ok(Store { conn: Mutex::new(conn) })
    }

    /// Upgrades databases from when lists had a season: the season start stands in for the
    /// unknown creation date.
    fn migrate(conn: &Connection) -> Result<(), rusqlite::Error> {
        let has_season: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM pragma_table_info('documents') WHERE name = 'season_start'",
            [],
            |r| r.get(0),
        )?;
        if has_season {
            conn.execute_batch(
                "BEGIN;
                 ALTER TABLE documents ADD COLUMN created_on TEXT;
                 UPDATE documents SET created_on = season_start;
                 ALTER TABLE documents DROP COLUMN season_start;
                 ALTER TABLE documents DROP COLUMN season_end;
                 COMMIT;",
            )?;
        }
        Ok(())
    }

    fn conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap_or_else(|p| p.into_inner())
    }

    pub fn create_document(&self, today: NaiveDate) -> Result<String, StoreError> {
        let id = new_document_id();
        self.conn()
            .execute("INSERT INTO documents (id, created_on) VALUES (?1, ?2)", params![id, today])?;
        Ok(id)
    }

    pub fn get_document(&self, id: &str) -> Result<Document, StoreError> {
        let conn = self.conn();
        let archived: bool = conn
            .query_row("SELECT archived_at IS NOT NULL FROM documents WHERE id = ?1", [id], |r| r.get(0))
            .optional()?
            .ok_or(StoreError::NotFound)?;

        let mut people: Vec<Person> = Vec::new();
        let mut stmt =
            conn.prepare("SELECT id, name FROM people WHERE document_id = ?1 ORDER BY id")?;
        for row in stmt.query_map([id], |r| Ok((r.get(0)?, r.get(1)?)))? {
            let (id, name) = row?;
            people.push(Person { id, name, vacations: Vec::new() });
        }
        let mut stmt = conn.prepare(
            "SELECT v.id, v.person_id, v.start, v.end FROM vacations v
             JOIN people p ON p.id = v.person_id
             WHERE p.document_id = ?1 ORDER BY v.start",
        )?;
        for row in stmt.query_map([id], |r| {
            Ok((r.get::<_, i64>(1)?, Vacation { id: r.get(0)?, start: r.get(2)?, end: r.get(3)? }))
        })? {
            let (pid, vac) = row?;
            if let Some(p) = people.iter_mut().find(|p| p.id == pid) {
                p.vacations.push(vac);
            }
        }
        Ok(Document { archived, people })
    }

    /// Fails unless the document exists and is not archived.
    fn check_writable(conn: &Connection, id: &str) -> Result<(), StoreError> {
        let archived: bool = conn
            .query_row("SELECT archived_at IS NOT NULL FROM documents WHERE id = ?1", [id], |r| r.get(0))
            .optional()?
            .ok_or(StoreError::NotFound)?;
        if archived { Err(StoreError::Archived) } else { Ok(()) }
    }

    pub fn add_person(&self, doc: &str, raw_name: &str) -> Result<Person, StoreError> {
        let name = validation::validate_name(raw_name)?;
        let conn = self.conn();
        Self::check_writable(&conn, doc)?;
        let count: i64 =
            conn.query_row("SELECT COUNT(*) FROM people WHERE document_id = ?1", [doc], |r| r.get(0))?;
        if count as usize >= validation::MAX_PEOPLE_PER_DOC {
            return Err(ValidationError::TooManyPeople.into());
        }
        match conn.execute("INSERT INTO people (document_id, name) VALUES (?1, ?2)", params![doc, name]) {
            Ok(_) => Ok(Person { id: conn.last_insert_rowid(), name, vacations: Vec::new() }),
            Err(rusqlite::Error::SqliteFailure(e, _))
                if e.code == rusqlite::ErrorCode::ConstraintViolation =>
            {
                Err(ValidationError::NameTaken.into())
            }
            Err(e) => Err(e.into()),
        }
    }

    pub fn delete_person(&self, doc: &str, person: i64) -> Result<(), StoreError> {
        let conn = self.conn();
        Self::check_writable(&conn, doc)?;
        let n = conn.execute("DELETE FROM people WHERE id = ?1 AND document_id = ?2", params![person, doc])?;
        if n == 0 { Err(StoreError::NotFound) } else { Ok(()) }
    }

    pub fn add_vacation(
        &self,
        doc: &str,
        person: i64,
        start: NaiveDate,
        end: NaiveDate,
        today: NaiveDate,
    ) -> Result<Vacation, StoreError> {
        let conn = self.conn();
        Self::check_writable(&conn, doc)?;
        conn.query_row(
            "SELECT 1 FROM people WHERE id = ?1 AND document_id = ?2",
            params![person, doc],
            |_| Ok(()),
        )
        .optional()?
        .ok_or(StoreError::NotFound)?;
        let existing: Vec<(NaiveDate, NaiveDate)> = conn
            .prepare("SELECT start, end FROM vacations WHERE person_id = ?1")?
            .query_map([person], |r| Ok((r.get(0)?, r.get(1)?)))?
            .collect::<Result<_, _>>()?;
        validation::validate_range(start, end, today, &existing)?;
        conn.execute(
            "INSERT INTO vacations (person_id, start, end) VALUES (?1, ?2, ?3)",
            params![person, start, end],
        )?;
        Ok(Vacation { id: conn.last_insert_rowid(), start, end })
    }

    pub fn delete_vacation(&self, doc: &str, person: i64, vacation: i64) -> Result<(), StoreError> {
        let conn = self.conn();
        Self::check_writable(&conn, doc)?;
        let n = conn.execute(
            "DELETE FROM vacations WHERE id = ?1 AND person_id = ?2
             AND person_id IN (SELECT id FROM people WHERE document_id = ?3)",
            params![vacation, person, doc],
        )?;
        if n == 0 { Err(StoreError::NotFound) } else { Ok(()) }
    }

    /// Archives documents created at least `MIN_LIFETIME_MONTHS` ago whose latest vacation ended
    /// at least `GRACE_MONTHS` ago, and deletes documents archived longer than `retention_days`.
    /// Returns (archived, deleted).
    pub fn run_archiver(&self, today: NaiveDate, retention_days: i64) -> Result<(usize, usize), StoreError> {
        let conn = self.conn();
        let archived = conn.execute(
            "UPDATE documents SET archived_at = ?1 WHERE archived_at IS NULL
             AND date(created_on, ?2) <= ?1
             AND date(COALESCE(
                 (SELECT MAX(v.end) FROM vacations v JOIN people p ON p.id = v.person_id
                  WHERE p.document_id = documents.id),
                 created_on), ?3) <= ?1",
            params![
                today,
                format!("+{MIN_LIFETIME_MONTHS} months"),
                format!("+{GRACE_MONTHS} months")
            ],
        )?;
        let purge_before = today - Duration::days(retention_days);
        let deleted = conn.execute(
            "DELETE FROM documents WHERE archived_at IS NOT NULL AND archived_at < ?1",
            params![purge_before],
        )?;
        Ok((archived, deleted))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(s: &str) -> NaiveDate {
        s.parse().unwrap()
    }

    const TODAY: &str = "2027-03-01";

    fn doc(store: &Store) -> String {
        store.create_document(d(TODAY)).unwrap()
    }

    #[test]
    fn ids_are_unique_and_22_chars() {
        let a = new_document_id();
        assert_eq!(a.len(), 22);
        assert_ne!(a, new_document_id());
    }

    #[test]
    fn people_and_vacations_roundtrip() {
        let s = Store::open_in_memory().unwrap();
        let id = doc(&s);
        let p = s.add_person(&id, " Åsa ").unwrap();
        assert_eq!(p.name, "Åsa");
        assert!(matches!(
            s.add_person(&id, "Åsa"),
            Err(StoreError::Invalid(ValidationError::NameTaken))
        ));
        s.add_vacation(&id, p.id, d("2027-07-01"), d("2027-07-14"), d(TODAY)).unwrap();
        assert!(matches!(
            s.add_vacation(&id, p.id, d("2027-07-10"), d("2027-07-20"), d(TODAY)),
            Err(StoreError::Invalid(ValidationError::RangeOverlap))
        ));
        let got = s.get_document(&id).unwrap();
        assert_eq!(got.people[0].vacations.len(), 1);
        let vid = got.people[0].vacations[0].id;
        s.delete_vacation(&id, p.id, vid).unwrap();
        s.delete_person(&id, p.id).unwrap();
        assert!(s.get_document(&id).unwrap().people.is_empty());
    }

    #[test]
    fn cannot_touch_other_documents() {
        let s = Store::open_in_memory().unwrap();
        let a = doc(&s);
        let b = doc(&s);
        let p = s.add_person(&a, "Anna").unwrap();
        assert!(matches!(s.delete_person(&b, p.id), Err(StoreError::NotFound)));
        assert!(matches!(
            s.add_vacation(&b, p.id, d("2027-07-01"), d("2027-07-02"), d(TODAY)),
            Err(StoreError::NotFound)
        ));
    }

    #[test]
    fn archives_a_year_after_creation_when_vacations_end_earlier() {
        let s = Store::open_in_memory().unwrap();
        let id = doc(&s);
        let p = s.add_person(&id, "Anna").unwrap();
        s.add_vacation(&id, p.id, d("2027-07-01"), d("2027-07-14"), d(TODAY)).unwrap();
        assert_eq!(s.run_archiver(d("2028-02-29"), 365).unwrap(), (0, 0));
        assert_eq!(s.run_archiver(d("2028-03-01"), 365).unwrap(), (1, 0));
        assert!(s.get_document(&id).unwrap().archived);
        assert!(matches!(s.add_person(&id, "Bo"), Err(StoreError::Archived)));
        assert_eq!(s.run_archiver(d("2029-02-28"), 365).unwrap(), (0, 0));
        assert_eq!(s.run_archiver(d("2029-03-02"), 365).unwrap(), (0, 1));
        assert!(matches!(s.get_document(&id), Err(StoreError::NotFound)));
    }

    #[test]
    fn archives_a_month_after_the_last_vacation_when_that_is_later() {
        let s = Store::open_in_memory().unwrap();
        let id = doc(&s);
        let p = s.add_person(&id, "Anna").unwrap();
        s.add_vacation(&id, p.id, d("2028-04-01"), d("2028-04-20"), d(TODAY)).unwrap();
        assert_eq!(s.run_archiver(d("2028-03-01"), 365).unwrap(), (0, 0));
        assert_eq!(s.run_archiver(d("2028-05-19"), 365).unwrap(), (0, 0));
        assert_eq!(s.run_archiver(d("2028-05-20"), 365).unwrap(), (1, 0));
    }

    #[test]
    fn migrates_season_documents() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE documents (id TEXT PRIMARY KEY, season_start TEXT NOT NULL,
                 season_end TEXT NOT NULL, archived_at TEXT);
             INSERT INTO documents VALUES ('old', '2027-06-01', '2027-08-31', NULL);",
        )
        .unwrap();
        let s = Store::init(conn).unwrap();
        assert!(!s.get_document("old").unwrap().archived);
        s.create_document(d(TODAY)).unwrap();
        assert_eq!(s.run_archiver(d("2028-05-31"), 365).unwrap(), (1, 0)); // the new one
        assert_eq!(s.run_archiver(d("2028-06-01"), 365).unwrap(), (1, 0));
    }
}
