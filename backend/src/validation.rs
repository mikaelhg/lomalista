use chrono::{Months, NaiveDate};
use unicode_normalization::UnicodeNormalization;

pub const MAX_NAME_CHARS: usize = 15;
pub const MAX_RANGES_PER_PERSON: usize = 10;
pub const MAX_PEOPLE_PER_DOC: usize = 100;
/// How far ahead a vacation may start.
pub const MAX_MONTHS_AHEAD: u32 = 18;

#[derive(Debug, PartialEq, Eq)]
pub enum ValidationError {
    NameEmpty,
    NameTooLong,
    NameChars,
    RangeOrder,
    RangeInPast,
    RangeTooFar,
    RangeOverlap,
    TooManyRanges,
    TooManyPeople,
    NameTaken,
}

impl ValidationError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::NameEmpty => "name_empty",
            Self::NameTooLong => "name_too_long",
            Self::NameChars => "name_chars",
            Self::RangeOrder => "range_order",
            Self::RangeInPast => "range_in_past",
            Self::RangeTooFar => "range_too_far",
            Self::RangeOverlap => "range_overlap",
            Self::TooManyRanges => "too_many_ranges",
            Self::TooManyPeople => "too_many_people",
            Self::NameTaken => "name_taken",
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

pub fn validate_range(
    start: NaiveDate,
    end: NaiveDate,
    today: NaiveDate,
    existing: &[(NaiveDate, NaiveDate)],
) -> Result<(), ValidationError> {
    if start > end {
        return Err(ValidationError::RangeOrder);
    }
    if end < today {
        return Err(ValidationError::RangeInPast);
    }
    if today.checked_add_months(Months::new(MAX_MONTHS_AHEAD)).is_none_or(|last| start > last) {
        return Err(ValidationError::RangeTooFar);
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
        let today = d("2026-06-01");
        let ex = [(d("2026-06-10"), d("2026-06-20"))];
        assert!(validate_range(d("2026-06-21"), d("2026-06-25"), today, &ex).is_ok());
        assert_eq!(
            validate_range(d("2026-06-20"), d("2026-06-25"), today, &ex),
            Err(ValidationError::RangeOverlap)
        );
        assert_eq!(
            validate_range(d("2026-05-20"), d("2026-05-31"), today, &ex),
            Err(ValidationError::RangeInPast)
        );
        assert!(validate_range(d("2026-05-31"), d("2026-06-02"), today, &ex).is_ok());
        assert!(validate_range(d("2027-12-01"), d("2027-12-05"), today, &ex).is_ok());
        assert_eq!(
            validate_range(d("2027-12-02"), d("2027-12-05"), today, &ex),
            Err(ValidationError::RangeTooFar)
        );
        assert_eq!(
            validate_range(d("2026-07-02"), d("2026-07-01"), today, &ex),
            Err(ValidationError::RangeOrder)
        );
    }
}
