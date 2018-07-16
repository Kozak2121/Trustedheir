import {Meteor} from 'meteor/meteor';
import {ROLE, ADMIN_EMAIL} from './constants';

Meteor.startup(() => {
    process.env.MAIL_URL = '';
    const admin = Accounts.findUserByEmail(ADMIN_EMAIL);
    if (!admin) {
        const admin = {
            email: ADMIN_EMAIL,
            username: 'test',
            password: 'test',
            profile: {
                firstName: 'test',
                lastName: 'test',
                email: ADMIN_EMAIL
            }
        };
        const newAdmin = Accounts.createUser(admin);
        Roles.addUsersToRoles(newAdmin, [ROLE.ADMIN]);
        const createdAdmin = Accounts.findUserByEmail(ADMIN_EMAIL);
        Meteor.users.update({_id: createdAdmin._id}, {
            $set: {
                'emails.0.createdAt': new Date(),
                'emails.0.currentEmail': true
            }
        });
    }

  // code to run on server at startup
    ServiceConfiguration.configurations.upsert(
        {
            service: 'auth0'
        }, {
            $set: {
                loginStyle:   'redirect',
                domain:       'trustedheir.auth0.com',
                clientId:     '',
                clientSecret: ''
            }
        }
    );
});
