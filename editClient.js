import {STATES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('AdminEditClientCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Edit Client | TrustedHeir";
        const self = this;
        const $clientId = $stateParams.id;
        self.statesList = STATES;
        self.client = {};
        const currentUser = Session.get('currentUser');
        if (currentUser) {
            Meteor.call('getUserById', $clientId, (err, user) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    $scope.user = user.profile;
                });
            });
        }

        self.submitForm = client => {
            if (client.$valid) {
                let newClient = {
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
                    $location.path(`/admin/estate-planner-center/${$location.search().estatePlannerId}`).search({});
                    $scope.$apply();
                });
            }
        };
    }]);
