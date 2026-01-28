export class Reading {
  constructor({
    id,
    takenAt,
    heightIn,
    weightLb,
    spo2Pct,
    tempF,
    heartRate,
    respRate,
    systolicBp,
    diastolicBp
  }) {
    this.id = id;
    this.takenAt = takenAt;
    this.heightIn = heightIn;
    this.weightLb = weightLb;
    this.spo2Pct = spo2Pct;
    this.tempF = tempF;
    this.heartRate = heartRate;
    this.respRate = respRate;
    this.systolicBp = systolicBp;
    this.diastolicBp = diastolicBp;
  }
}
