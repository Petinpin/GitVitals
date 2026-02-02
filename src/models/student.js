import { Person } from "./person.js";
import { StudentReading } from "./studentReading.js";

export class Student extends Person {
  constructor({ id, name, dob, studentNumber }) {
    super({ id, name, dob });
    this.studentNumber = studentNumber;
    this.submissions = [];
  }

  submitReading({ studentReadingId, reading }) {
    const submission = new StudentReading({
      id: studentReadingId,
      student: this,
      reading
    });

    this.submissions.push(submission);
    return submission;
  }
}
