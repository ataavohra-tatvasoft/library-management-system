import { Schema, model, Model } from 'mongoose'
import { IUserRoleMapping } from '../../interfaces'

type UserRoleMappingModel = Model<IUserRoleMapping>

const userRoleMappingSchema: Schema<IUserRoleMapping, UserRoleMappingModel> = new Schema<
  IUserRoleMapping,
  UserRoleMappingModel
>({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  roleID: {
    type: Schema.Types.ObjectId,
    ref: 'roles',
    required: true
  },
  deletedAt: {
    type: Date,
    allownull: true,
    default: null
  }
})

// Ensure userID and bookID pair is unique
userRoleMappingSchema.index({ userID: 1, roleID: 1 }, { unique: true })

export const UserRoleMapping: UserRoleMappingModel = model<IUserRoleMapping, UserRoleMappingModel>(
  'userrolemappings',
  userRoleMappingSchema
)
