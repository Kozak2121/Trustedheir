export const ROLE = {
    ADMIN: 'admin',
    ESTATE_PLANNER: 'estatePlanner',
    CLIENT: 'client',
    TRUSTEE: 'trustee'
};

export const SECRET_KEY = '';
export const STRIPE_KEY = '';
export const TEST_STRIPE_KEY = '';

export const STRIPE_PLAN_ID = '';
export const INTERCOM_APP_ID = '';
export const AWS_ACCESS_KEY_ID = '';
export const AWS_SECRET_ACCESS_KEY = '';

export const ADMIN_EMAIL = 'maksymkhrystenko@gmail.com';
export const ADMIN_ADDITIONAL_EMAIL = 'maksymkhrystenko@gmail.com';

export const SUBSCRIPTION_STATUSES = {
  trialing: 'Active',
  active: 'Active',
  past_due: 'Active',
  canceled: 'Pending',
  unpaid: 'Pending'
};

export const STATUS = {
    numeric: {
        ESTATE_PLANNER_NO_PAYMENT_INFO: 17,
        ESTATE_PLANNER_VISITED: 18,
        ESTATE_PLANNER_PAYMENT_INFO: 15,
        ESTATE_PLANNER_ACCOUNT_ACTIVE: 12,
        ESTATE_PLANNER_ACCOUNT_CLOSED: 13,
        ESTATE_PLANNER_ACCOUNT_SUSPENDED: 14,
        ESTATE_PLANNER_CLOSE_ACCOUNT_INITIATED: 26,
        CLIENT_INVITED: 1,
        CLIENT_VISITED: 19,
        CLIENT_ACCOUNT_CREATED: 11,
        CLIENT_ACCOUNT_DELETED: 2,
        CLIENT_ACTIVE: 3,
        POST_PASSING_IN_PROGRESS: 16,
        TRUSTEE_INVITED: 4,
        TRUSTEE_VISITED: 20,
        TRUSTEE_ACCEPTED: 5,
        TRUSTEE_DECLINED: 6,
        TRUSTEE_ACTIVE: 7,
        TRUSTEE_ACCOUNT_DELETED: 10,
        DIGITAL_ASSET_ACTIVE: 8,
        DIGITAL_ASSET_DELETED: 9,
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS: 21,
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED: 22,
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED: 23,
        DIGITAL_ASSET_COMPLETED: 24,
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED: 25
    },
    literal: {
        ESTATE_PLANNER_NO_PAYMENT_INFO: 'No payment info',
        ESTATE_PLANNER_VISITED: 'Visited',
        ESTATE_PLANNER_PAYMENT_INFO: 'Payment info',
        ESTATE_PLANNER_ACCOUNT_ACTIVE: 'Active',
        ESTATE_PLANNER_ACCOUNT_CLOSED: 'Account closed',
        ESTATE_PLANNER_ACCOUNT_SUSPENDED: 'Account suspended',
        ESTATE_PLANNER_CLOSE_ACCOUNT_INITIATED: 'Close account initiated',
        CLIENT_INVITED: 'Invited',
        CLIENT_VISITED: 'Visited',
        CLIENT_ACCOUNT_CREATED: 'Account created',
        CLIENT_ACCOUNT_DELETED: 'Account deleted',
        CLIENT_ACTIVE: 'Active',
        POST_PASSING_IN_PROGRESS: 'Post-passing in progress',
        TRUSTEE_INVITED: 'Invited',
        TRUSTEE_VISITED: 'Visited',
        TRUSTEE_ACCEPTED: 'Accepted',
        TRUSTEE_DECLINED: 'Declined',
        TRUSTEE_ACTIVE: 'Active',
        TRUSTEE_ACCOUNT_DELETED: 'Account deleted',
        DIGITAL_ASSET_ACTIVE: 'Active',
        DIGITAL_ASSET_DELETED: 'Deleted',
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS: 'Digital Asset in Post-passing Process',
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED: 'Digital Asset in Post-passing Process - Re-opened',
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED: 'Digital Asset in Post-passing Process - Issue Reported',
        DIGITAL_ASSET_COMPLETED: 'Digital Asset completed',
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED: 'Digital Asset viewed'
    }
};

export const ASSET_STATUS_MESSAGE = {
    DIGITAL_ASSET_ACTIVE: 'You have activated digital asset',
    DIGITAL_ASSET_DELETED: 'You have canceled digital asset',
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS: 'You are started Post-passing process',
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED: 'You are viewed digital asset',
    DIGITAL_ASSET_COMPLETED: 'Digital asset is completed',
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED: 'Issue report is created',
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED: 'Digital asset is re-opened'
};

export const TEMPLATES = {
    ESTATE_PLANNER_WELCOME_EMAIL: '058f4f82-a689-4abf-8984-e5b3a4f9b4ac',
    ESTATE_PLANNER_REGISTRATION_CONFIRMATION: '5b195d8c-9a56-44b1-b12f-aa67ac92e02e',
    ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_CLOSED: 'ee0303f8-7bcd-4fda-9220-679321ea5f02',
    ESTATE_PLANNER_ACCOUNT_REACTIVATED: '1abf61a6-dfec-477d-838f-52c7bb7a4ba3',
    ESTATE_PLANNER_ACCOUNT_SUSPENDED: '7741a716-0c5e-4d4a-a385-eb3dec737841',
    ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_ACTIVE: '517b1d0e-2c27-448e-94da-033f50bf0635',
    ESTATE_PLANNER_CANCEL_ACCOUNT: '71055ee8-f02b-4f60-bbae-d3729f0205b2',
    FIRST_CLIENT_ADDED: '3ab7f020-aae7-47bf-becb-56080d844c2a',
    ADD_CLIENT_ABANDONED: '03a368ac-ed8f-41b4-a10d-b50ed5d35868',
    MONTHLY_SUMMARY: 'c68950dd-283f-4016-acc4-b6f42202d201',
    MONTHLY_SUMMARY_INACTIVE: '4435a875-3406-4080-ada7-1fcd36be9e44',
    ESTATE_PLANNER_PASSWORD_RESET: '92d719de-3c44-4c2c-93d0-b2803233f767',
    ESTATE_PLANNER_PASSWORD_CHANGED: 'c77dd18a-0c14-47e7-a7a5-7795b21d449e',
    CLIENT_INVITE: '5cc43c33-82de-4052-9cb3-d9402d6087c1',
    CLIENT_WELCOME: '5c032319-01f5-41bb-b0b9-ddb7fbdf2121',
    TRUSTEE_INVITE: '2f667779-db82-482c-85e1-155cdbe7a81f',
    TRUSTEE_ACCEPTED: '435c61f4-7c75-471b-b5b5-2e7e69067243',
    TRUSTEE_DECLINED: '70ad9dc2-8c24-490f-b8ac-a1b0c986fe51',
    TRUSTEE_WELCOME: '68563d78-b373-4dab-a3bf-2093ec0e122b',
    TRUSTEE_POST_PASSING: 'a3ff8106-2dee-40b2-9d13-2b131ba11f04',
    CLIENT_PASSWORD_RESET: 'f002b1c9-d915-422f-afe2-af82bc19147c',
    CLIENT_PASSWORD_CHANGED: '3a0ab827-2aa6-4592-b942-1d7e9b7919e4',
    TWO_FACTOR_AUTHENTICATION: '1af27c3c-d7e4-4f6c-a71b-97631cd17253',
    CLIENT_ACCOUNT_REACTIVATED: '4506dadb-d123-4312-ba18-d4f393b9fd38',
    CLIENT_ACCOUNT_CLOSED: 'de1e14c2-b513-4e0b-815d-e3cbd8229866',
    CLIENT_INVITE_THREE_DAY_FOLLOW_UP: 'c2494f58-988b-45c4-909d-46f026b29906',
    CLIENT_INVITE_SEVEN_DAY_FOLLOW_UP: '31cd3948-23e7-4c2b-9c7d-870a7f403bcd',
    CLIENT_FIRST_DIGITAL_ASSET_ADDED: '84e109f6-cf19-414c-8c77-5fb88bfc9347',
    TRUSTEE_THREE_DAY_FOLLOW_UP: '7d97f894-2767-46cf-98ab-ae6bf251a7e8',
    TRUSTEE_SEVEN_DAY_FOLLOW_UP: '0f729196-9646-45a7-82e7-d5579f04e435',
    TRUSTEE_RESET_PASSWORD: '9e492a1e-769f-4edc-938d-dc261e7a2f0b',
    ADMIN_RESET_PASSWORD: '6c914b37-05e7-4605-a2c7-c0dcd8760e7c',
    MONTHLY_INVOICE_PAID: 'a3f9d39f-e99f-4234-9f7c-0daf90bfd2c3',
    CREDIT_CARD_BILLING_UNSUCCESSFUL: '48b3cb6f-486a-40da-ba46-039e244425f5'
};