import {STATUS} from '../../lib/constants';
import moment from 'moment';

angular
    .module('trustedheir')
    .controller('EstatePlannerClientCenterCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Client Center | TrustedHeir";
        const self = this;
        self.estatePlanner = Session.get('currentUser');
        self.isMostRecent = true;
        self.status = STATUS.numeric;
        const page = 3;
        const initialQuery = {
            skip: 0,
            limit: page
        };
        self.isLoading = false;
        if (self.estatePlanner) {
            Meteor.call('getClientsWithAssetsAndTrustees', self.estatePlanner._id, initialQuery, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.countOfAllItems = cb.countOfAllItems;
                    self.clients = cb.clients;
                    $scope.$apply();
                })
            });
        }

        self.getMoreItems = () => {
            if (self.clients && self.clients.length > 0) {
                self.isLoading = true;
                const len = self.clients.length;
                const query = {
                    skip: len,
                    limit: page
                };
                Meteor.call('getClientsWithAssetsAndTrustees', self.estatePlanner._id, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.oldClients = self.clients;
                    self.clients = self.oldClients.concat(cb.clients);
                    self.isLoading = false;
                    $scope.$apply();
                });
            }
        };


        self.startReportPassing = clientId => {
            bootbox.hideAll();
            $location.path(`/estate-planner/report-passing/${clientId}`);
        };

        self.formatDate = date => moment(date).format('ll');

        self.selectSorting = isMostRecent => {
            if (isMostRecent) {
                self.isMostRecent = true;
                self.clients.sort((a, b) => {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            } else {
                self.isMostRecent = false;
                self.clients.sort((a, b) => {
                    return a.profile.firstName.toLowerCase().localeCompare(b.profile.firstName.toLowerCase()) ||
                        a.profile.lastName.toLowerCase().localeCompare(b.profile.lastName.toLowerCase()) ||
                        new Date(b.createdAt) - new Date(a.createdAt) || 0;
                });
            }
        };

        self.addClient = () => $location.path('/estate-planner/add-client');

        self.editClient = (e, clientId) => {
            e.stopPropagation();
            $location.path(`/estate-planner/edit-client/${clientId}`);
        };

        self.showClientDigitalAssets = clientId => $location.path(`/estate-planner/client-center/${clientId}`);

        self.removeClient = (e, client) => {
            e.stopPropagation();
            const profile = client.profile;
            bootbox.confirm({
                title: "Delete client?",
                message: `Deleting a Client ${profile.firstName} ${profile.lastName} will permanently delete their digital estate plan and the Client will no longer be able to access their account.`,
                buttons: {
                    confirm: {
                        label: 'Yes, Delete Client',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No, Keep Client',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        self.isLoading = true;
                        const len = self.clients.length;
                        const query = {
                            skip: 0,
                            limit: len
                        };
                        Meteor.call('removeClient', client, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('setRecentActivity', self.estatePlanner._id);
                            Meteor.call('getClientsWithAssetsAndTrustees', self.estatePlanner._id, query, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    self.oldClients = self.clients;
                                    self.clients = cb.clients;
                                    self.countOfAllItems = cb.countOfAllItems;
                                    self.isLoading = false;
                                    toastr.success(`You've successfully deleted ${profile.firstName} ${profile.lastName} account. They will no longer be able to access their account.`, 'SUCCESS');
                                    $scope.$apply();
                                })
                            });
                        });
                    }
                }
            });
        };

        self.reActivateClient = (e, client) => {
            e.stopPropagation();
            const profile = client.profile;
            bootbox.confirm({
                title: 'Re-activate Client?',
                message: `Do you really want to Re-activate Client?`,
                buttons: {
                    confirm: {
                        label: 'Yes, re-activate Client',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: "No, don't re-activate Client",
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        self.isLoading = true;
                        const len = self.clients.length;
                        const query = {
                            skip: 0,
                            limit: len
                        };
                        Meteor.call('reActivateClient', client, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('setRecentActivity', self.estatePlanner._id);
                            Meteor.call('getClientsWithAssetsAndTrustees', self.estatePlanner._id, query, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    self.clients = cb.clients;
                                    self.countOfAllItems = cb.countOfAllItems;
                                })
                            });
                            self.isLoading = false;
                            toastr.success(`You've successfully re-activated ${profile.firstName} ${profile.lastName} account.`, 'SUCCESS');
                            $scope.$apply();
                        });
                    }
                }
            });
        };
    }]);
