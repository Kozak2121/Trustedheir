import {STATES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('EstatePlannerEditClientCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Manage Client | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        const $clientId = $stateParams.id;
        self.statesList = STATES;
        self.user = {};
        if (currentUser) {
            Meteor.call('getUserById', $clientId, (err, user) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.user = user.profile;
                });
            });
        }

        self.submitForm = client => {
            if (client.$valid) {
                const newClient = {
                    username: `${client.firstName.$viewValue} ${client.lastName.$viewValue} _${Random.id()}`,
                    profile: {
                        firstName: client.firstName.$viewValue,
                        lastName: client.lastName.$viewValue,
                        address: client.address.$viewValue,
                        city: client.city.$viewValue,
                        state: client.state.$viewValue,
                        zipCode: client.zipCode.$viewValue
                    }
                };
                Meteor.call('updateUser', $clientId, newClient, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (cb.message) {
                        cb.message = 'Client information successfully updated';
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Meteor.call('setRecentActivity', currentUser._id);
                    $location.path('/estate-planner/client-center');
                    $scope.$apply();
                });
            }
        };

        self.removeClient = (e, client) => {
            e.stopPropagation();
            bootbox.confirm({
                title: "Delete client?",
                message: `Deleting a Client ${client.firstName} ${client.lastName} will permanently delete their digital estate plan and the Client will no longer be able to access their account.`,
                buttons: {
                    confirm: {
                        label: 'Yes, delete client',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No, keep client',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        Meteor.call('removeClient', client, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('getClients', currentUser._id, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    self.clients = cb;
                                })
                            });
                            toastr.success(`You've successfully deleted ${client.firstName} ${client.lastName} account. They will no longer be able to access their account.`, 'SUCCESS');
                            Meteor.call('setRecentActivity', currentUser._id);
                            $location.path('/estate-planner/client-center');
                            $scope.$apply();
                        });
                    }
                }
            });
        };
    }]);
