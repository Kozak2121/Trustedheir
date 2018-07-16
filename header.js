import {ROLE, STATUS} from '../lib/constants';

angular
    .module('trustedheir')
    .controller('HeaderCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', ($scope, $state, $window, $document, $location) => {
        const self = this;
        const currentUser = Session.get('currentUser');
        if (currentUser && currentUser.roles.length > 1 && currentUser.roles.includes('client') && !(Session.get('currentMultipleRole') ? Session.get('currentMultipleRole').role : null)) {
            Session.setPersistent('currentMultipleRole', {role: 'client'});
        }
        self.currentRole = Session.get('currentMultipleRole') ? Session.get('currentMultipleRole').role : null;
        self.status = STATUS.numeric;
        self.toggleMenu = () => {
            if (angular.element('#navbar-collapse').hasClass('in')) angular.element('#navbar-collapse').removeClass('in');
            else angular.element('#navbar-collapse').addClass('in');
        };

        self.switchStatus = (role) => {
            if (role === 'trustee') {
                Session.setPersistent('currentMultipleRole', {role});
                $location.path('/trustee/digital-assets');
            } else if (role === 'client') {
                Session.setPersistent('currentMultipleRole', {role});
                $location.path('/client/digital-assets');
            }
        };

        self.setCurrentUserName = () => {
            const currentUser = Session.get('currentUser');
            if (currentUser) {
                self.sessionUser = currentUser;
                self.userStatus = currentUser.status;
                self.authLink = 'Sign Out';
                self.accountLink = currentUser.roles[0] === ROLE.TRUSTEE ? 'trustee/digital-assets' :
                    currentUser.roles[0] === ROLE.ADMIN ? 'admin/estate-planner-center' :
                        currentUser.roles[0] === ROLE.CLIENT ? 'client/digital-assets' :
                            currentUser.roles[0] === ROLE.ESTATE_PLANNER ? 'estate-planner/client-center' : '#';
                self.userName = currentUser.profile.firstName + ' ' + currentUser.profile.lastName;
            } else {
                self.authLink = 'Sign In';
                self.userName = 'anonymous';
            }
        };

        self.setCurrentUserName();

        $scope.$on('currentUserChanged', (event, data) => {
            self.setCurrentUserName();
            $scope.$apply();
        });

        self.auth = () => {
            if (currentUser) {
                Meteor.logout((err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.authLink = 'Sign In';
                    self.userName = 'anonymous';
                    self.sessionUser = null;
                    Session.clear('currentUser');
                    self.currentRole = null;
                    Session.clear('currentMultipleRole');
                    $location.search({});
                    $location.path('/sign-in');
                    $scope.$apply();
                });
            } else {
                $location.path('/sign-in');
            }
        };
    }]);
