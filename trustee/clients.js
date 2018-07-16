import {STATUS} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('TrusteClientsCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Clients | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        self.status = STATUS.literal;
        self.dateOfClose = null;
        self.isMostRecent = true;
        const page = 3;
        const initialQuery = {
            skip: 0,
            limit: page
        };
        self.isLoading = false;
        if (currentUser) {
            Meteor.call('getClientsOfTrustee', currentUser, initialQuery, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    cb.clients.forEach(client => {
                        if (client.status) {
                            for (let key in STATUS.numeric) {
                                if (client.status === STATUS.numeric[key]) {
                                    client.status = STATUS.literal[key];
                                }
                            }
                        } else client.status = 'No info';
                    });
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
                Meteor.call('getClientsOfTrustee', currentUser, query, (err, cb) => {
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

    }]);
