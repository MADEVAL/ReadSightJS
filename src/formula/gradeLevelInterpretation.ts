/** Maps a normalized grade-level score to a US school-grade label. */
export class GradeLevelInterpretation {
  static forScore(score: number): string {
    if (score <= 1.0) {
      return "Kindergarten";
    } else if (score <= 2.0) {
      return "1st Grade";
    } else if (score <= 3.0) {
      return "2nd Grade";
    } else if (score <= 4.0) {
      return "3rd Grade";
    } else if (score <= 5.0) {
      return "4th Grade";
    } else if (score <= 6.0) {
      return "5th Grade";
    } else if (score <= 7.0) {
      return "6th Grade";
    } else if (score <= 8.0) {
      return "7th Grade";
    } else if (score <= 9.0) {
      return "8th Grade";
    } else if (score <= 10.0) {
      return "9th Grade";
    } else if (score <= 11.0) {
      return "10th Grade";
    } else if (score <= 12.0) {
      return "11th Grade";
    } else if (score <= 13.0) {
      return "12th Grade";
    } else if (score <= 16.0) {
      return "College";
    } else {
      return "Graduate";
    }
  }
}
