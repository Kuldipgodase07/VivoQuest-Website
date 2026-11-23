export const careService = {
  async getPatients() {
    return [
      { id: "P-101", name: "Pooja Nair", age: 64, gender: "Female", condition: "Post-cardiac Rehab", nurse: "Vandana Rao", status: "Stable", vitals: { bp: "124/80", hr: 74, spo2: 98 } }
    ];
  }
};
