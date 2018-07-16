import {ARTICLES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('EstatePlannerSetPasswordCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        document.title = "Set Password | TrustedHeir";
        const self = this;
        const token = $stateParams.token;
        self.showPasswordFields = false;

        Meteor.call('getEstatePlannerByToken', token, (err, cb) => {
            if (err) {
                return toastr.error(err.message, 'ERROR');
            }
            if (cb.ok === 0) {
                toastr.error(`We're sorry, this link is no longer valid.`, 'ERROR');
                $location.path('/');
                $scope.$apply();
            } else if (cb.ok === 1) {
                self.showPasswordFields = true;
                $scope.$broadcast('currentUserChanged');
                Session.setPersistent('currentUser', cb.estatePlanner);
                self.estatePlannerId = cb.estatePlanner._id;
                self.oldEmail = cb.estatePlanner.emails[0].address;
                self.newEmail = cb.estatePlanner.emails[0].address;
            } else if (cb.ok === 2) {
                const estatePlannerByToken = cb.estatePlanner;
                Meteor.call('createEstatePlannerNoPayment', estatePlannerByToken._id, estatePlannerByToken, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    Session.setPersistent('currentUser', estatePlannerByToken);
                    toastr.success(cb.message, 'SUCCESS');
                    Meteor.call('setRecentActivity', estatePlannerByToken._id);
                    $location.path('/estate-planner/add-payment-info');
                    $scope.$apply();
                });
            }
        });


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
            Meteor.call('changeEmail', self.estatePlannerId, self.newEmail, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                bootbox.hideAll();
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', self.estatePlannerId);
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
                                <div class="digital-asset__titleGrayLight">{{epsp.oldEmail}}</div>
                                <form name="changeEmailForm" ng-submit="epsp.changeEmail()"  novalidate>
                                  <div class="form-group pos-rel" ng-class="{ 'has-error' : changeEmailForm.newEmail.$invalid && !changeEmailForm.newEmail.$pristine }">
                                            <label>Your new email:</label>
                                            <input type="email" name="newEmail" class="form-control" ng-model="epsp.newEmail" placeholder="Email" required>
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

        self.submitForm = passwords => {
            if (passwords.$valid) {
                const newPassword = passwords.password.$viewValue;
                Accounts.resetPassword(token, newPassword, (err) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    Meteor.call('createEstatePlannerNoPayment', Meteor.userId(), Meteor.user(), (err, cb) => {
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        toastr.success(cb.message, 'SUCCESS');
                        Meteor.call('setRecentActivity', Meteor.userId());
                        $location.path('/estate-planner/add-payment-info');
                        $scope.$apply();
                    });
                });
            }
        }
    }]);
