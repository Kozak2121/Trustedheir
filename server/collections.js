import { Mongo } from 'meteor/mongo';
export const Assets = new Mongo.Collection('assets');
export const StripeSubscriptions = new Mongo.Collection('stripe_subscriptions');
export const FutureEvents = new Mongo.Collection('future_events');