const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Notes are assigned to specific users
// Notes have ticket #, tiltle, note body
// Also have created and updated dates
// get objectId and ref to User
// timestamps: true as an option for the schema creates
// created at and updated at timestamps
// mongoose-sequence package helps us issue ticket numbers in a sequence
const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// this will create a ticket field inside our note schema
noteSchema.plugin(AutoIncrement, {
  inc_field: "ticket",
  id: "ticketNums",
  start_seq: 500,
});

module.exports = mongoose.model("Note", noteSchema);
