import { helperFunctionsUtils, loggerUtils } from '../../utils'
import { ILibraryBranch } from '../../interfaces'
import { LibraryBranch } from '../models/libraryBranch.model'

export const seedLibraryBranches = async () => {
  await LibraryBranch.deleteMany({})
  loggerUtils.logger.info('Deleted all library branches!')

  const librarybranches = [
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 1',
      address: 'Bodakdev,Ahmedabad',
      phoneNumber: '919845754510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 2',
      address: 'Ambavadi,Ahmedabad',
      phoneNumber: '919849784510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 3',
      address: 'Prahladhnagar,Ahmedabad',
      phoneNumber: '919878844510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 4',
      address: 'Thaltej,Ahmedabad',
      phoneNumber: '919884514510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 5',
      address: 'Paldi,Ahmedabad',
      phoneNumber: '919865404510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 6',
      address: 'Bodakdev,Ahmedabad',
      phoneNumber: '919896544510'
    }
  ]

  const insertedLibraryBranches: ILibraryBranch[] = await LibraryBranch.insertMany(librarybranches)
  loggerUtils.logger.info('Inserted new library branches!')

  return insertedLibraryBranches
}
