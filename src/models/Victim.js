import mongoose from "mongoose";

const VictimSchema = new mongoose.Schema({
  name: { type: String, required: true },
  referenceCode: { type: String, required: true, unique: true },
  identificationType: {
    type: String,
    enum: ["identificada", "não identificada"],
    default: "não identificada",
  },
  birthDate: { type: Date },
  age: { type: Number },
  gender: {
    type: String,
    enum: ["masculino", "feminino", "outro"],
    default: "outro",
  },
  cases: [
    {
      caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
      relationType: { type: String },
    },
  ],
});

VictimSchema.pre("validate", function (next) {
  if (this.birthDate) {
    const birth = new Date(this.birthDate);
    const today = new Date();
    let calcAge = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      calcAge--;
    }
    this.age = calcAge;
  }
  next();
});

const Victim = mongoose.model("Victim", VictimSchema);

export default Victim;
