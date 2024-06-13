import moment from 'moment';
import loggerUtils from './logger.utils';

const validateAgeLimit = (dateOfBirth: string) => {
    try {
        // Validate date format (optional, adjust if needed)
        const isValidDate = moment(dateOfBirth, true).isValid();
        if (!isValidDate) {
            throw new Error('dateOfBirth must be a valid date format');
        }

        // Calculate minimum allowed birth date for users 12 years or older (adjust age limit as needed)
        loggerUtils.logger.info(isValidDate);
        const minAllowedDate = moment().subtract(12, 'years').startOf('day');
        loggerUtils.logger.info(minAllowedDate);
        loggerUtils.logger.info(moment(dateOfBirth));

        // Check if dateOfBirth is greater than or equal to minimum allowed date
        if (moment(dateOfBirth) > minAllowedDate) {
            throw new Error('Age must be 12 years old!');
        }

        return true;
    } catch (error) {
        loggerUtils.logger.error(error);
        return false;
    }
};

const numberOfFreeDays = (issueDate: Date, quantityAvailable: number) => {
    try {
        const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

        const today = new Date();

        if (quantityAvailable == 1) {
            // Calculate the difference in milliseconds
            const timeDifference = issueDate.getTime() - today.getTime();
            loggerUtils.logger.info(timeDifference);
            // Convert milliseconds to days
            const daysDifference = Math.floor(timeDifference / DAY_IN_MILLISECONDS);
            loggerUtils.logger.info(daysDifference);

            // Ensure non-negative days
            return Math.max(daysDifference);
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
};

const generatePlaceholderbookID = () => {
    const prefix = '999'; // Replace with a distinct prefix for your placeholders
    const randomDigits = Math.floor(Math.random() * 10 ** 10)
        .toString()
        .padStart(10, '0');
    return `${prefix}${randomDigits}`;
};

export default {
    validateAgeLimit,
    numberOfFreeDays,
    generatePlaceholderbookID,
};
