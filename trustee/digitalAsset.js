import {ROLE, CATEGORIES, STATUS} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('TrusteeDigitalAssetCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Digital Asset | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        const $trusteeId = $stateParams.id;
        const $trusteeToken = $stateParams.trusteeToken;
        self.wait = true;
        self.category = '';
        self.categoryWarning = false;
        self.isAllCategoriesActive = true;
        self.categories = CATEGORIES;
        self.status = STATUS.numeric;
        self.selectedTrustees = [];

        if ($trusteeToken) {
            Meteor.call('getAssetByTrustee', $trusteeId, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    let asset = cb;
                    if (!cb.ok) {
                        const msg = cb.message;
                        Meteor.call('loginByToken', $trusteeToken, (err, cb) => {
                            $timeout(() => {
                                if (err || !cb.ok) {
                                    if (currentUser && currentUser.roles[0] === ROLE.TRUSTEE) {
                                        toastr.error(`We're sorry, this link is no longer valid.`, 'ERROR');
                                        $location.search({});
                                        $location.url($location.path());
                                        $scope.$apply();
                                    }
                                } else {
                                    let trustee = cb.user;
                                    Meteor.call('setRecentActivity', trustee._id);
                                    if (currentUser && trustee._id === currentUser._id) {
                                        toastr.error(msg, 'ERROR');
                                        $location.search({});
                                        $location.path('/trustee/digital-assets');
                                        $scope.$apply();
                                    } else {
                                        Session.setPersistent('currentUser', trustee);
                                        toastr.success('You successfully signed in', 'SUCCESS');
                                        toastr.error(msg, 'ERROR');
                                        $location.search({});
                                        $location.path('/trustee/digital-assets');
                                        $scope.$apply();
                                    }
                                }
                            });
                        });
                    } else if (cb.ok) {
                        Meteor.call('loginByToken', $trusteeToken, (err, cb) => {
                            $timeout(() => {
                                if (err || !cb.ok) {
                                    if (currentUser && currentUser.roles[0] === ROLE.TRUSTEE) {
                                        toastr.error(`We're sorry, this link is no longer valid.`, 'ERROR');
                                        $location.url($location.path());
                                        $scope.$apply();
                                    }
                                } else {
                                    const trustee = cb.user;
                                    Meteor.call('setRecentActivity', trustee._id);
                                    Meteor.call('changeAssetStatus', $trusteeId, STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED, (err, cb) => {
                                        if (err) {
                                            return toastr.error(err.message, 'ERROR');
                                        }
                                        if (currentUser && trustee._id === currentUser._id) {
                                            $location.search({});
                                            $location.path(`/trustee/digital-asset/post-passing/${asset._id}`);
                                            $scope.$apply();
                                        } else {
                                            Session.setPersistent('currentUser', trustee);
                                            toastr.success('You successfully signed in', 'SUCCESS');
                                            $location.search({});
                                            $location.path(`/trustee/digital-asset/post-passing/${asset._id}`);
                                            $scope.$apply();
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            });
        } else {
            self.wait = false;
        }

        if (currentUser && !$trusteeToken) {
            Meteor.call('getAssetByTrustee', $trusteeId, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (!cb.ok) {
                        toastr.error(cb.message, 'ERROR');
                        $location.search({});
                        $location.path('/trustee/digital-assets');
                        $scope.$apply();
                    } else if (cb.ok) {
                        self.asset = cb;
                        self.asset.confirmPassword = cb.password;
                        self.category = cb.category;
                    }
                });
            });
        }

        self.reportIssueOfDigitalAsset = assetId => {
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getAssetByTrustee', $trusteeId, (err, cb) => {
                    $timeout(() => {
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        if (!cb.ok) {
                            toastr.error(cb.message, 'ERROR');
                            $location.search({});
                            $location.path('/trustee/digital-assets');
                            $scope.$apply();
                        } else if (cb.ok) {
                            self.asset = cb;
                            self.asset.confirmPassword = cb.password;
                            self.category = cb.category;
                            $scope.$apply();
                        }
                    });
                });
            });
        };

        self.markDigitalAssetAsCompleted = assetId => {
            Meteor.call('addAssetToCompleted', assetId, currentUser._id, (err, cb) => {
                "use strict";
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_COMPLETED, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Meteor.call('setRecentActivity', currentUser._id);
                    $location.path(`/trustee/digital-assets/${self.asset.clientId}`);
                    $scope.$apply();
                });
            });
        };

        self.changeAssetStatus = (assetId, status) => {
            Meteor.call('changeAssetStatus', assetId, status, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getAssetByTrustee', currentUser._id, (err, assets) => {
                    self.assets = assets;
                    $scope.$apply();
                });
            });
        };

        self.goBack = clientId => {
            $location.path(`/trustee/digital-assets/${clientId}`);
        };

    }]);
