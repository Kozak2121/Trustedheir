import {STATUS, ARTICLES, ROLE} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('TrusteeAcceptRejectCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        document.title = "Accept - Reject | TrustedHeir";
        const self = this;
        const token = $stateParams.token;
        const clientId = $stateParams.id;

        Meteor.call('getTrusteeByToken', token, clientId, (err, cb) => {
            $timeout(() => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                if (!cb || cb.trustee.status === STATUS.numeric.TRUSTEE_ACCOUNT_DELETED) {
                    toastr.error(`We're sorry, this link is no longer valid. Please contact your client for additional information.`, 'ERROR');
                    $location.path('/');
                    $scope.$apply();
                } else {
                    self.trusteeFirstName = cb.trustee.profile.firstName;
                    self.trusteeId = cb.trustee._id;
                    self.trustee = cb.trustee;
                    self.oldEmail = cb.trustee.emails[0].address;
                    self.newEmail = cb.trustee.emails[0].address;
                    self.clientUsername = cb.client.profile.firstName + ' ' + cb.client.profile.lastName;
                    if (cb.trustee.status === STATUS.numeric.TRUSTEE_ACCEPTED && cb.trustee.reason !== 'acceptReject') {
                        self.isShowedSetPasswordForm = true
                    }
                    $scope.$apply();
                }
            })
        });

        self.submitForm = passwords => {
            if (passwords.$valid) {
                const newPassword = passwords.password.$viewValue;
                Accounts.resetPassword(token, newPassword, (err) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    Meteor.call('createTrusteeActive', Meteor.userId(), (err, cb) => {
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        Session.setPersistent('currentUser', cb.trustee);
                        toastr.success(cb.message, 'SUCCESS');
                        Meteor.call('setRecentActivity', self.trusteeId);
                        $location.search({});
                        $location.path(`/trustee/digital-assets/${clientId}`);
                        $scope.$apply();
                    });
                });
            }
        };

        self.showTermsOfService = () => {
            const tplCrop = ARTICLES.TERMS_OF_SERVICE_AGREEMENT;
            const template = angular.element(tplCrop);
            const linkFn = $compile(template);
            const html = linkFn($scope);
            bootbox.dialog({
                title: 'TrustedHeir.com | Terms of Service Agreement',
                className: "large",
                message: html,
                closeButton: true
            });
        };

        self.showPrivacyPolicy = () => {
            const tplCrop = ARTICLES.PRIVACY_POLICY;
            const template = angular.element(tplCrop);
            const linkFn = $compile(template);
            const html = linkFn($scope);
            bootbox.dialog({
                title: 'TrustedHeir.com | Privacy Policy',
                className: "large",
                message: html,
                closeButton: true
            });
        };

        self.changeEmail = () => {
            Meteor.call('changeEmail', self.trusteeId, self.newEmail, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                bootbox.hideAll();
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', self.trusteeId);
                self.oldEmail = self.newEmail;
                $scope.$apply();
            });
        };

        self.showChangeEmailDialog = () => {
            const tplCrop = `<div class="row">
                                 <div class="mg-15">
                                 <div class="form-title col-md-12 form-desc mg-t-15 mg-b-20">
                                        Set your new email
                                    </div>
                                <div class="digital-asset__titleGrayBold">Your old email:</div>
                                <div class="digital-asset__titleGrayLight">{{tar.oldEmail}}</div>
                                <form name="changeEmailForm" ng-submit="tar.changeEmail()"  novalidate>
                                  <div class="form-group pos-rel" ng-class="{ 'has-error' : changeEmailForm.newEmail.$invalid && !changeEmailForm.newEmail.$pristine }">
                                            <label>Your new email:</label>
                                            <input type="email" name="newEmail" class="form-control" ng-model="tar.newEmail" placeholder="Email" required>
                                            <span ng-if="changeEmailForm.newEmail.$valid"
                                              class="checkmark"></span>
                                            <p ng-show="changeEmailForm.newEmail.$error.required && !changeEmailForm.newEmail.$pristine"
                                               class="help-block">
                                                Please enter the new email address</p>
                                            <p ng-show="changeEmailForm.newEmail.$invalid && !changeEmailForm.newEmail.$pristine && !changeEmailForm.newEmail.$error.required"
                                               class="help-block">Sorry, this doesn't look like a valid email address.
                                                Please
                                                re-enter the email address.</p>
                                   </div>
                                <input type="submit" ng-disabled="changeEmailForm.newEmail.$invalid" class="form-button full-width white-button mg-b-15" value="Change email"/>
                                </form>
                              </div>
                          </div>`;
            const template = angular.element(tplCrop);
            const linkFn = $compile(template);
            const html = linkFn($scope);

            bootbox.dialog({
                className: "medium",
                message: html,
                closeButton: true
            });
        };

        self.acceptAgreement = () => {
            Meteor.call('acceptTrustee', self.trustee, clientId, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (self.trustee.reason === 'acceptReject') {
                        Session.setPersistent('currentUser', self.trustee);
                        toastr.success(cb.message, 'SUCCESS');
                        Meteor.call('setRecentActivity', self.trusteeId);
                        $location.search({});
                        $location.path(`/trustee/digital-assets/${clientId}`);
                    } else {
                        self.isShowedSetPasswordForm = true;
                    }
                })
            });
        };

        self.rejectAgreement = () => {
            Meteor.call('rejectTrustee', self.trustee, clientId, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (self.trustee.roles.includes(ROLE.CLIENT)) {
                        Session.setPersistent('currentUser', self.trustee);
                        toastr.warning(cb.message, 'WARNING');
                        $location.search({});
                        $location.path('/client/digital-assets');
                    }
                    else if (self.trustee.reason === 'acceptReject') {
                        Session.setPersistent('currentUser', self.trustee);
                        toastr.warning(cb.message, 'WARNING');
                        Meteor.call('setRecentActivity', self.trusteeId);
                        $location.search({});
                        $location.path('/trustee/digital-assets');
                    } else {
                        toastr.warning(cb.message, 'WARNING');
                        $location.search({});
                        $location.path('/');
                    }
                })
            });
        }
    }]);
