import { Author } from '../models'
import { loggerUtils } from '../../utils'

export const seedAuthors = async () => {
  await Author.deleteMany({})
  loggerUtils.logger.info('Deleted all authors!')

  const authors = [
    {
      email: 'jane.doe@example.com',
      firstname: 'Jane',
      lastname: 'Doe',
      bio: 'Jane Doe is an acclaimed writer known for her vivid storytelling and rich characters.',
      website: 'https://janedoe.com',
      address: '123 Main St, Springfield'
    },
    {
      email: 'john.smith@example.com',
      firstname: 'John',
      lastname: 'Smith',
      bio: 'John Smith is a prolific author with numerous bestsellers across various genres.',
      website: 'https://johnsmith.com',
      address: '456 Elm St, Shelbyville'
    },
    {
      email: 'emily.brown@example.com',
      firstname: 'Emily',
      lastname: 'Brown',
      bio: 'Emily Brown writes inspiring and heartwarming tales that captivate readers of all ages.',
      website: 'https://emilybrown.com',
      address: '789 Oak St, Capital City'
    },
    {
      email: 'michael.jones@example.com',
      firstname: 'Michael',
      lastname: 'Jones',
      bio: 'Michael Jones is known for his thrilling novels that keep readers on the edge of their seats.',
      website: 'https://michaeljones.com',
      address: '101 Maple St, Ogdenville'
    },
    {
      email: 'sarah.wilson@example.com',
      firstname: 'Sarah',
      lastname: 'Wilson',
      bio: 'Sarah Wilson’s works are a perfect blend of fantasy and reality, drawing readers into magical worlds.',
      website: 'https://sarahwilson.com',
      address: '202 Birch St, North Haverbrook'
    },
    {
      email: 'david.taylor@example.com',
      firstname: 'David',
      lastname: 'Taylor',
      bio: 'David Taylor is a celebrated author known for his deep and thought-provoking works.',
      website: 'https://davidtaylor.com',
      address: '303 Pine St, Brockway'
    },
    {
      email: 'olivia.moore@example.com',
      firstname: 'Olivia',
      lastname: 'Moore',
      bio: 'Olivia Moore crafts intricate mysteries that leave readers guessing until the last page.',
      website: 'https://oliviamoore.com',
      address: '404 Cedar St, Ogdenville'
    },
    {
      email: 'william.thomas@example.com',
      firstname: 'William',
      lastname: 'Thomas',
      bio: 'William Thomas writes historical fiction that brings past eras to life with meticulous detail.',
      website: 'https://williamthomas.com',
      address: '505 Walnut St, North Haverbrook'
    },
    {
      email: 'amelia.jackson@example.com',
      firstname: 'Amelia',
      lastname: 'Jackson',
      bio: 'Amelia Jackson’s novels are known for their emotional depth and compelling characters.',
      website: 'https://ameliajackson.com',
      address: '606 Ash St, Springfield'
    },
    {
      email: 'james.white@example.com',
      firstname: 'James',
      lastname: 'White',
      bio: 'James White’s science fiction novels explore futuristic worlds and complex moral dilemmas.',
      website: 'https://jameswhite.com',
      address: '707 Willow St, Shelbyville'
    }
  ]

  const insertedAuthors = await Author.insertMany(authors)
  loggerUtils.logger.info('Inserted new authors!')

  return insertedAuthors
}
