use chrono::{Duration, NaiveDate};
use unicode_normalization::UnicodeNormalization;

pub const MAX_NAME_CHARS: usize = 15;
pub const MAX_RANGES_PER_PERSON: usize = 10;
pub const MAX_PEOPLE_PER_DOC: usize = 100;
pub const MAX_SEASON_DAYS: i64 = 366;

#[derive(Debug, PartialEq, Eq)]
pub enum ValidationError {
    NameEmpty,
    NameTooLong,
    NameChars,
    RangeOrder,
    RangeOutsideSeason,
    RangeOverlap,
    TooManyRanges,
    TooManyPeople,
    NameTaken,
    SeasonOrder,
    SeasonTooLong,
    SeasonInPast,
}

impl ValidationError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::NameEmpty => "name_empty",
            Self::NameTooLong => "name_too_long",
            Self::NameChars => "name_chars",
            Self::RangeOrder => "range_order",
            Self::RangeOutsideSeason => "range_outside_season",
            Self::RangeOverlap => "range_overlap",
            Self::TooManyRanges => "too_many_ranges",
            Self::TooManyPeople => "too_many_people",
            Self::NameTaken => "name_taken",
            Self::SeasonOrder => "season_order",
            Self::SeasonTooLong => "season_too_long",
            Self::SeasonInPast => "season_in_past",
        }
    }
}

fn is_nordic_letter(c: char) -> bool {
    c.is_ascii_alphabetic() || "ÅÄÖÆØÞÐÁÉÍÓÚÝåäöæøþðáéíóúý".contains(c)
}

/// Returns the NFC-normalised, trimmed name if it is acceptable.
/// Letters (A-Z plus å ä ö æ ø þ ð), with single inner spaces or hyphens, at most 15 characters.
pub fn validate_name(raw: &str) -> Result<String, ValidationError> {
    let name: String = raw.trim().nfc().collect();
    if name.is_empty() {
        return Err(ValidationError::NameEmpty);
    }
    if name.chars().count() > MAX_NAME_CHARS {
        return Err(ValidationError::NameTooLong);
    }
    let mut prev_sep = true; // disallows a leading separator
    for c in name.chars() {
        let sep = c == ' ' || c == '-';
        if sep && prev_sep || !sep && !is_nordic_letter(c) {
            return Err(ValidationError::NameChars);
        }
        prev_sep = sep;
    }
    if prev_sep {
        return Err(ValidationError::NameChars);
    }
    Ok(name)
}

pub fn validate_season(
    start: NaiveDate,
    end: NaiveDate,
    today: NaiveDate,
) -> Result<(), ValidationError> {
    if start > end {
        return Err(ValidationError::SeasonOrder);
    }
    if (end - start).num_days() >= MAX_SEASON_DAYS {
        return Err(ValidationError::SeasonTooLong);
    }
    if end < today - Duration::days(30) {
        return Err(ValidationError::SeasonInPast);
    }
    Ok(())
}

pub fn validate_range(
    start: NaiveDate,
    end: NaiveDate,
    season: (NaiveDate, NaiveDate),
    existing: &[(NaiveDate, NaiveDate)],
) -> Result<(), ValidationError> {
    if start > end {
        return Err(ValidationError::RangeOrder);
    }
    if start < season.0 || end > season.1 {
        return Err(ValidationError::RangeOutsideSeason);
    }
    if existing.len() >= MAX_RANGES_PER_PERSON {
        return Err(ValidationError::TooManyRanges);
    }
    if existing.iter().any(|&(s, e)| start <= e && s <= end) {
        return Err(ValidationError::RangeOverlap);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(s: &str) -> NaiveDate {
        s.parse().unwrap()
    }

    #[test]
    fn names_accept_nordic() {
        for n in ["Åsa", "Jørgen", "Þórunn", "Aðalsteinn", "Anna-Liisa", "Mari Ö", "ÄÖÅ"] {
            assert!(validate_name(n).is_ok(), "{n}");
        }
    }

    #[test]
    fn names_normalise_combining() {
        let decomposed = "A\u{030A}sa"; // A + combining ring
        assert_eq!(validate_name(decomposed).unwrap(), "Åsa");
    }

    #[test]
    fn names_reject() {
        assert_eq!(validate_name("  "), Err(ValidationError::NameEmpty));
        assert_eq!(validate_name("abcdefghijklmnop"), Err(ValidationError::NameTooLong));
        for n in ["Bob1", "Žilvinas", "😀", "-Anna", "Anna-", "A  B", "A--B", "a_b", "<b>"] {
            assert_eq!(validate_name(n), Err(ValidationError::NameChars), "{n}");
        }
        assert!(validate_name("abcdefghijklmno").is_ok());
    }

    #[test]
    fn ranges() {
        let season = (d("2026-06-01"), d("2026-08-31"));
        let ex = [(d("2026-06-10"), d("2026-06-20"))];
        assert!(validate_range(d("2026-06-21"), d("2026-06-25"), season, &ex).is_ok());
        assert_eq!(
            validate_range(d("2026-06-20"), d("2026-06-25"), season, &ex),
            Err(ValidationError::RangeOverlap)
        );
        assert_eq!(
            validate_range(d("2026-05-31"), d("2026-06-02"), season, &ex),
            Err(ValidationError::RangeOutsideSeason)
        );
        assert_eq!(
            validate_range(d("2026-07-02"), d("2026-07-01"), season, &ex),
            Err(ValidationError::RangeOrder)
        );
    }

    #[test]
    fn seasons() {
        let today = d("2026-10-11");
        assert!(validate_season(d("2027-06-01"), d("2027-08-31"), today).is_ok());
        assert_eq!(validate_season(d("2027-06-02"), d("2027-06-01"), today), Err(ValidationError::SeasonOrder));
        assert_eq!(validate_season(d("2027-01-01"), d("2029-01-01"), today), Err(ValidationError::SeasonTooLong));
        assert_eq!(validate_season(d("2025-06-01"), d("2025-08-01"), today), Err(ValidationError::SeasonInPast));
    }
}
