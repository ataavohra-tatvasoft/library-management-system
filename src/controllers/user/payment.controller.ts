import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import { User } from '../../db/models';
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../../constant';
import { Controller } from '../../interfaces';
import { responseHandlerUtils } from '../../utils';
import { envConfig } from '../../config';
import { PaymentCard } from '../../db/models/paymentCard.model';

/**
 * @description Adds payment card for user
 */
const addPaymentCard: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stripe = new Stripe(String(envConfig.stripeApiKey));
        const { email } = req.params;
        let isDefault;

        const user = await User.findOne({ email });
        if (!user) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const { cardNumber, cardBrand, expirationMonth, expirationYear, cvv } = req.body;

        if (!cardNumber || !cardBrand || !expirationMonth || !expirationYear || !cvv) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.MISSING_PAYMENT_CARD_DETAILS,
            });
        }

        const customer = await stripe.customers.create({
            name: String(user.firstname + ' ' + user.lastname),
            email: String(user.email),
        });
        if (!customer) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.ERROR_WHILE_CREATING_STRIPE_CUSTOMER,
            });
        }

        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: String(cardNumber),
                exp_month: Number(expirationMonth),
                exp_year: Number(expirationYear),
                cvc: String(cvv),
            },
            customer: String(customer.id),
        });

        const lastFourDigits = cardNumber.slice(-4);

        const hashedLastFourDigits = await bcrypt.hash(
            lastFourDigits,
            Number(envConfig.saltRounds)
        );

        const paymentCardExists = await PaymentCard.findOne({
            userID: user._id,
            paymentMethodID: paymentMethod.id,
            cardBrand,
            lastFourDigits: hashedLastFourDigits,
            expirationMonth,
            expirationYear,
        });
        if (paymentCardExists) {
            isDefault = false;
        }

        const newPaymentCard = await PaymentCard.create({
            userID: user._id,
            paymentMethodID: paymentMethod.id,
            cardBrand,
            lastFourDigits: hashedLastFourDigits,
            expirationMonth,
            expirationYear,
            isDefault,
        });
        if (!newPaymentCard) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.ERROR_WHILE_ADDING_PAYMENT_CARD,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.CREATED,
            message: messageConstant.PAYMENT_CARD_ADDED_SUCCESSFULLY,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Lists payment card of the user
 */
const paymentCardsList: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;

        const user = await User.findOne({ email });
        if (!user) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const paymentCardLists = await PaymentCard.find({ userID: user._id, isDeleted: false });
        if (!paymentCardLists) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.CREATED,
                message: messageConstant.NO_PAYMENT_CARDS_FOUND,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: httpErrorMessageConstant.SUCCESSFUL,
            data: {
                paymentCardLists,
            },
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Executes payment for user for its due charges
 */
const payCharges: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stripe = new Stripe(String(envConfig.stripeApiKey));
        const { email } = req.params;
        const { amount, paymentMethodID } = req.body;

        if (!paymentMethodID) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.MISSING_PAYMENT_METHOD,
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Number(amount),
            currency: 'inr',
        });

        const confirmResult = await stripe.paymentIntents.confirm(paymentIntent.id, {
            payment_method: paymentMethodID,
        });

        if (confirmResult.status === 'succeeded') {
            const updatedDueCharges: number = Number(user.dueCharges) - Number(amount);
            await User.updateOne({ email }, { $set: { dueCharges: updatedDueCharges } });

            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.OK,
                message: messageConstant.PAYMENT_SUCCESSFUL,
            });
        } else {
            console.error('Payment failed:', confirmResult);
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.PAYMENT_FAILED,
            });
        }
    } catch (error) {
        return next(error);
    }
};

export default {
    addPaymentCard,
    paymentCardsList,
    payCharges,
};
