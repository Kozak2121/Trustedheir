import {CATEGORIES, STATUS} from '../../lib/constants';
import {detectWindowSize} from '../../lib/helpers';

angular
    .module('trustedheir')
    .controller('TrusteeClientDigitalAssetsCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        const self = this;
        const currentUser = Session.get('currentUser');
        const $clientId = $stateParams.id;
        self.username = currentUser.profile.firstName + ' ' + currentUser.profile.lastName;
        self.category = '';
        self.categoryWarning = false;
        self.isAllCategoriesActive = true;
        self.allCategories = CATEGORIES;
        self.status = STATUS.numeric;
        const page = 3;
        const initialQuery = {
            skip: 0,
            limit: page
        };
        self.isLoading = false;
        if (currentUser) {
            Meteor.call('getClientAssetsOfTrustee', currentUser, $clientId, initialQuery, (err, cb) => {
                $timeout(() => {
                    "use strict";
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.assets = cb.finalAssets;
                    self.clientName = cb.client.profile.firstName + ' ' + cb.client.profile.lastName;
                    self.countOfAllItems = cb.countOfAllItems;
                    $scope.$apply();
                });
            });
        }

        self.getMoreItems = () => {
            if (self.assets && self.assets.length > 0) {
                self.isLoading = true;
                const len = self.assets.length;
                const query = {
                    skip: len,
                    limit: page
                };
                Meteor.call('getClientAssetsOfTrustee', currentUser, $clientId, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.oldAssets = self.assets;
                    self.assets = self.oldAssets.concat(cb.finalAssets);
                    self.isLoading = false;
                    $scope.$apply();
                });
            }
        };

        self.generateHiddenCategories = () => {
            const scope = $scope.$new();
            angular.element('#categories-list').html("");
            self.hiddenCategories.forEach(category => {
                const tplCrop = `<li ng-class="{active: tcda.category==='${category}'}" ng-click="tcda.selectCategory($event)"> ${category} </li>`;
                const template = angular.element(tplCrop);
                const linkFn = $compile(template)(scope);
                angular.element('#categories-list').append(linkFn);
            });
        };

        self.splitCategories = () => {
            const detectWindowSizeCategories = detectWindowSize(self.allCategories);
            self.categories = detectWindowSizeCategories.categories;
            self.hiddenCategories = detectWindowSizeCategories.hiddenCategories;
            self.generateHiddenCategories();
        };

        self.splitCategories();
        if ($window.outerWidth >= 992) {
            self.isBigResolution = true;
        }

        angular.element($window).bind('resize', () => {
            if ($window.outerWidth >= 992) {
                self.isBigResolution = true;
            }
            self.splitCategories();
            $scope.$digest();
        });

        self.generateHiddenCategories();

        self.selectCategory = (e, isAllCategories) => {
            if (isAllCategories) {
                self.isAllCategoriesActive = true;
                self.category = null;
            } else {
                self.isAllCategoriesActive = false;
                self.category = e.currentTarget.innerText;
                let indexOfSelectedCategory = 0;
                self.allCategories.forEach((category, index) => {
                    if (self.category === category) {
                        indexOfSelectedCategory = index;
                    }
                });
                const cuttedCategory = self.allCategories.splice(indexOfSelectedCategory, 1);
                self.allCategories.unshift(cuttedCategory[0]);
                self.splitCategories();
            }
        };

        self.openCategoryList = () => angular.element('#categories-list').show();

        $('.btn-tag-link').on('blur', (e) => {
            setTimeout(() => {
                angular.element('#categories-list').hide();
            }, 200);
        });

        self.categoryFilter = item => item.category === self.category || self.isAllCategoriesActive;

        self.showDigitalAssetDetail = asset => {
            const tplCrop = `<div class="digital-asset">
                            <div class="asset-image">
                                    <img src="${asset.logo ? asset.logo : '/icons/no-logo.png'}">
                            </div>
                            <div class="digital-asset__titleBlueBold">${asset.name}</div>
                            <div class="digital-asset__titleGrayBold">Account login</div>
                            <div class="digital-asset__titleGrayLight">${asset.login}</div>
                            <div class="digital-asset__titleGrayBold">Password</div>
                            <div class="digital-asset__titleGrayLight">${asset.password}</div>
                            <div class="digital-asset__titleGrayBold">Website</div>
                            <div class="digital-asset__titleGrayLight">${asset.website}</div>
                            <div class="digital-asset__titleGrayBold">Notes/instructions</div>
                            <div class="digital-asset__titleGrayLight">${asset.notes}</div>
                            <div class="digital-asset__titleGrayBold">Category</div>
                            <div class="digital-asset__titleGrayLight">${asset.category}</div>
                            <div class="digital-asset__titleGrayBold">Client</div>
                            <div class="digital-asset__titleGrayLight">${asset.clientId.profile.firstName} ${asset.clientId.profile.lastName}</div>
                            <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_DELETED}" class="form-button removed-button mg-b-30">Digital asset was removed</span>
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

        self.startDigitalAsset = assetId => {
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                $location.path(`/trustee/digital-asset/post-passing/${assetId}`);
                $scope.$apply();
            });
        };

        self.digitalAssetViewDetails = assetId => {
            $location.path(`/trustee/digital-asset/post-passing/${assetId}`);
        };

        self.markDigitalAssetAsCompleted = assetId => {
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_COMPLETED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getClientAssetsOfTrustee', currentUser, $clientId, (err, cb) => {
                    $timeout(() => {
                        "use strict";
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        self.countOfAllItems = cb.countOfAllItems;
                        self.assets = cb.finalAssets;
                        $scope.$apply();
                    });
                });
            });
        };

        self.reportIssueOfDigitalAsset = assetId => {
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getClientAssetsOfTrustee', currentUser, $clientId, (err, cb) => {
                    $timeout(() => {
                        "use strict";
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        self.countOfAllItems = cb.countOfAllItems;
                        self.assets = cb.finalAssets;
                        $scope.$apply();
                    });
                });
            });
        };

        self.reopenDigitalAsset = assetId => {
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getClientAssetsOfTrustee', currentUser, $clientId, (err, cb) => {
                    $timeout(() => {
                        "use strict";
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        self.countOfAllItems = cb.countOfAllItems;
                        self.assets = cb.finalAssets;
                        $scope.$apply();
                    });
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
                Meteor.call('getClientAssetsOfTrustee', currentUser, $clientId, (err, cb) => {
                    $timeout(() => {
                        "use strict";
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        self.countOfAllItems = cb.countOfAllItems;
                        self.assets = cb.finalAssets;
                        $scope.$apply();
                    });
                });
            });
        };
    }]);
