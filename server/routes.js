import {Meteor} from 'meteor/meteor';
import Future from 'fibers/future';
import stripe from 'stripe';
import moment from 'moment';
import bodyParser from 'bodyParser';
import crypto from 'crypto';


import {StripeSubscriptions} from './collections';
import {STATUS, TEMPLATES, STRIPE_KEY, STRIPE_PLAN_ID, SECRET_KEY, ADMIN_EMAIL} from './constants';
import {decrypt, encrypt} from './methods/common';

const stripe_test = stripe(STRIPE_KEY);
Picker.middleware(bodyParser.json());
Picker.middleware(bodyParser.urlencoded({extended: false}));

const postRoutes = Picker.filter((req, res) => {
    return req.method == 'POST';
});

postRoutes.route('/api/stripe', (params, req, res, next) => {
    let reqBody = req.body;
    let myFuture = new Future();
    let invoiceId = reqBody.data.object.id;
    stripe_test.invoices.retrieve(invoiceId, Meteor.bindEnvironment((err, invoice) => {
            "use strict";
            if (err) {
                res.end('Information Error (invoices.retrieve)');
                return myFuture.throw(new Meteor.Error(err));
            }
            if (!invoice || invoice.next_payment_attempt || !invoice.total) {
                return res.end('Information received');
            }
            let totalNumber = invoice.total.toString();
            let i = totalNumber.length;
            let totalSum = `${totalNumber.slice(0, i - 2)}.${totalNumber.slice(i - 2, i)}`;
            let subscriptionDB = StripeSubscriptions.findOne({subscriptionId: encrypt(invoice.subscription)});
            if (subscriptionDB && invoice.paid) {
                stripe_test.subscriptions.del(invoice.subscription, Meteor.bindEnvironment((err, confirmation) => {
                        "use strict";
                        if (err) {
                            res.end('Information Error (subscriptions.del)');
                            return myFuture.throw(new Meteor.Error(err));
                        }
                        let nextMonth = moment(new Date().setMonth(new Date().getMonth() + 1, 1)).unix();
                        stripe_test.subscriptions.create({
                                customer: decrypt(subscriptionDB.customerId),
                                plan: STRIPE_PLAN_ID,
                                quantity: 0,
                                // trial_end: nextDay
                                trial_end: nextMonth
                            }, Meteor.bindEnvironment((err, subscription) => {
                                if (err) {
                                    res.end('Information Error (subscriptions.create)');
                                    return myFuture.throw(new Meteor.Error(err));
                                }
                                StripeSubscriptions.update({_id: subscriptionDB._id}, {
                                    $set: {
                                        subscriptionId: encrypt(subscription.id),
                                        quantity: 0,
                                        billingStatus: 'Paid',
                                        createdAt: new Date()
                                    },
                                    $addToSet: {
                                        invoiceId: encrypt(invoice.id)
                                    }
                                }, (err, cb) => {
                                    if (err) {
                                        res.end('Information Error (StripeSubscriptions.update)');
                                        return myFuture.throw(new Meteor.Error(err));
                                    }
                                    let estatePlanner = Meteor.users.findOne({_id: subscriptionDB.estatePlannerId});
                                    let billingURL = Meteor.absoluteUrl('estate-planner/billing');
                                    Email.send({
                                        from: ADMIN_EMAIL,
                                        to: estatePlanner.profile.email,
                                        headers: {
                                            'X-SMTPAPI': {
                                                'filters': {
                                                    'templates': {
                                                        'settings': {
                                                            'enable': 1,
                                                            'template_id': TEMPLATES.MONTHLY_INVOICE_PAID
                                                        }
                                                    }
                                                },
                                                'sub': {
                                                    '%EstatePlannerFirstName%': [estatePlanner.profile.firstName],
                                                    '%NumberOfNewClients%': [subscriptionDB.quantity],
                                                    '%Month%': [moment(new Date()).format('MMMM')],
                                                    '%Year%': [moment(new Date()).format('YYYY')],
                                                    '%Amount%': [totalSum],
                                                    '%BillingURL%': ['<a href="' + billingURL + '">Link</a>']
                                                },
                                            }
                                        }
                                    });
                                    return res.end('Information received');
                                });
                            })
                        );
                    })
                );
            } else if (subscriptionDB && !invoice.paid) {
                let estatePlanner = Meteor.users.findOne({_id: subscriptionDB.estatePlannerId});
                Meteor.users.update({_id: estatePlanner._id}, {
                    $set: {
                        status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_SUSPENDED,
                        dateOfSuspension: new Date()
                    },
                    $unset: {
                        dateOfClose: 1
                    }
                }, (err, cb) => {
                    if (err) {
                        res.end('Information Error (users.update)');
                        return myFuture.throw(new Meteor.Error(err));
                    }
                    let billingURL = Meteor.absoluteUrl('estate-planner/billing');
                    Email.send({
                        from: ADMIN_EMAIL,
                        to: estatePlanner.profile.email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.CREDIT_CARD_BILLING_UNSUCCESSFUL
                                        }
                                    }
                                },
                                'sub': {
                                    '%EstatePlannerFirstName%': [estatePlanner.profile.firstName],
                                    '%NumberOfNewClients%': [subscriptionDB.quantity],
                                    '%Month%': [moment(new Date()).format('MMMM')],
                                    '%Year%': [moment(new Date()).format('YYYY')],
                                    '%Amount%': [totalSum],
                                    '%BillingURL%': ['<a href="' + billingURL + '">Link</a>']
                                },
                            }
                        }
                    });
                    StripeSubscriptions.update({_id: subscriptionDB._id}, {
                        $set: {
                            billingStatus: 'Payment Declined',
                            createdAt: new Date()
                        }
                    }, (err, cb) => {
                        if (err) {
                            res.end('Information Error (StripeSubscriptions.update)');
                            return myFuture.throw(new Meteor.Error(err));
                        }
                        Email.send({
                            from: ADMIN_EMAIL,
                            to: estatePlanner.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                                'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_SUSPENDED
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]
                                    },
                                }
                            }
                        });
                        return res.end('Information received');
                    });
                });
            } else {
                StripeSubscriptions.insert(invoice);
                return res.end('Information received (Subscription Error)');
            }
        })
    );
    return myFuture.wait();
});