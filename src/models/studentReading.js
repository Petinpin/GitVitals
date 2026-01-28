export class StudentReading {
  constructor({ id, student, reading }) {
    this.id = id;
    this.student = student;
    this.reading = reading;

    this.isCorrect = null;
    this.gradedAt = null;
    this.instructorNotes = "";
  }

  grade({ isCorrect, gradedAt, instructorNotes }) {
    this.isCorrect = Boolean(isCorrect);
    this.gradedAt = gradedAt;
    this.instructorNotes = instructorNotes || "";
  }

  calculateGrade() {
    if (this.isCorrect === true) return 100;
    if (this.isCorrect === false) return 0;
    return 0;
  }
}
