// models/UserModel.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for the Address sub-document
export interface IAddress extends Document {
  name?: string;
  phoneNumber?: string;
  streetName?: string;
  town?: string;
  city?: string;
  houseName?: string;
  houseNumber?: string;
  country?: string;
}

// Interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  profilePicture?: string; // Match database field
  addresses?: IAddress[]; // Match database field - array of addresses
}

const addressSchema = new Schema<IAddress>({
  name: { type: String },
  phoneNumber: { type: String },
  streetName: { type: String },
  town: { type: String },
  city: { type: String },
  houseName: { type: String },
  houseNumber: { type: String },
  country: { type: String, default: 'Kenya' },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    profilePicture: { type: String }, // Match database field
    addresses: [Schema.Types.Mixed], // Use Mixed type to allow any structure
  },
  {
    timestamps: true,
  }
);

const UserModel =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', userSchema);

export default UserModel;