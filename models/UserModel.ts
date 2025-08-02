// models/UserModel.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for the Address sub-document
export interface IAddress extends Document {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Password is not always sent back
  isAdmin: boolean;
  addresses: IAddress[];
}

const addressSchema = new Schema<IAddress>({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    addresses: [addressSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const UserModel =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', userSchema);

export default UserModel;