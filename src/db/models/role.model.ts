import { Schema, model, Model } from 'mongoose'
import { UserType } from '../../types'
import { IRole } from '../../interfaces/role.interface'

type RoleModel = Model<IRole>

const roleSchema: Schema<IRole, RoleModel> = new Schema<IRole, RoleModel>({
  role: { type: String, enum: Object.values(UserType), required: true },
  deletedAt: {
    type: Date,
    allownull: true,
    default: null
  }
})

export const Role: RoleModel = model<IRole, RoleModel>('roles', roleSchema)
