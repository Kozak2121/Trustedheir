import {CATEGORIES, STATUS} from '../../lib/constants';
import {detectWindowSize} from '../../lib/helpers';

angular
    .module('trustedheir')
    .controller('EstatePlannerClientAssetsCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        document.title = "Client's Digital Assets | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        const $clientId = $stateParams.id;
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
            Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, initialQuery, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                self.assets = cb.finalAssets;
                self.countOfAllItems = cb.countOfAllItems;
                $scope.$apply();
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
                Meteor.call('getAssetsByClientId', currentUser._id, currentUser.roles, query, (err, cb) => {
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
                const tplCrop = `<li ng-class="{active: epca2.category==='${category}'}" ng-click="epca2.selectCategory($event)"> ${category} </li>`;
                const template = angular.element(tplCrop);
                const linkFn = $compile(template)(scope);
                angular.element('#categories-list').append(linkFn);
            });
        };

        self.splitCategories = () => {
            let detectWindowSizeCategories = detectWindowSize(self.allCategories);
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

        self.openCategoryList = () => {
            angular.element('#categories-list').show();
        };

        $('.btn-tag-link').on('blur', (e) => {
            setTimeout(() => {
                angular.element('#categories-list').hide();
            }, 200);
        });

        self.categoryFilter = item => {
            return item.category === self.category || self.isAllCategoriesActive;
        };

        self.startReportPassing = (e, assetId) => {
            let asset = {};
            self.assets.forEach((item) => {
                if (assetId === item._id) asset = item;
            });
            e.stopPropagation();
            bootbox.hideAll();
            if (asset) {
                self.isLoading = true;
                const len = self.assets.length;
                const query = {
                    skip: 0,
                    limit: len
                };
                Meteor.call('assetPostPassingProcess', asset, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Meteor.call('setRecentActivity', currentUser._id);
                    Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        self.assets = cb.finalAssets;
                        self.countOfAllItems = cb.countOfAllItems;
                        self.isLoading = false;
                        self.countOfAllItems = cb.countOfAllItems;
                        $scope.$apply();
                    });
                });
            }
        };

        self.markDigitalAssetAsCompleted = assetId => {
            self.isLoading = true;
            const len = self.assets.length;
            const query = {
                skip: 0,
                limit: len
            };
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_COMPLETED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.assets = cb.finalAssets;
                    self.isLoading = false;
                    self.countOfAllItems = cb.countOfAllItems;
                    $scope.$apply();
                });
            });
        };

        self.reportIssueOfDigitalAsset = (e, assetId) => {
            e.stopPropagation();
            bootbox.hideAll();
            self.isLoading = true;
            const len = self.assets.length;
            const query = {
                skip: 0,
                limit: len
            };
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.assets = cb.finalAssets;
                    self.isLoading = false;
                    self.countOfAllItems = cb.countOfAllItems;
                    $scope.$apply();
                });
            });
        };

        self.reopenDigitalAsset = (e, assetId) => {
            e.stopPropagation();
            bootbox.hideAll();
            self.isLoading = true;
            const len = self.assets.length;
            const query = {
                skip: 0,
                limit: len
            };
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.assets = cb.finalAssets;
                    self.isLoading = false;
                    self.countOfAllItems = cb.countOfAllItems;
                    $scope.$apply();
                });
            });
        };

        self.changeAssetStatus = (assetId, status) => {
            self.isLoading = true;
            const len = self.assets.length;
            const query = {
                skip: 0,
                limit: len
            };
            Meteor.call('changeAssetStatus', assetId, status, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.assets = cb.finalAssets;
                    self.countOfAllItems = cb.countOfAllItems;
                    $scope.$apply();
                });
            });
        };

        self.cancelReportPassing = (e, assetId) => {
            "use strict";
            e.stopPropagation();
            bootbox.hideAll();
            self.isLoading = true;
            const len = self.assets.length;
            const query = {
                skip: 0,
                limit: len
            };
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_DELETED, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
                Meteor.call('setRecentActivity', currentUser._id);
                Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.assets = cb.finalAssets;
                    self.countOfAllItems = cb.countOfAllItems;
                    $scope.$apply();
                });
            });
        };

        self.showDigitalAssetDetail = asset => {
            let trustees = ``;
            asset.trustees.forEach(trustee => {
                trustees += `<div class="digital-asset__titleGrayLight">${trustee.profile.firstName} ${trustee.profile.lastName}</div>`;
            });
            const tplCrop = `<div class="text-align-center">                                
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
                                <div class="digital-asset__titleGrayBold">Digital Trustee</div>
                                ` + trustees + `
                                <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_DELETED}"
                                  class="form-button status">Removed</span>
                                <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_ACTIVE}"
                                      class="form-button status">Active</span>
                                <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED}"
                                      class="form-button status">Post passing in progress (viewed)</span>
                                <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_IN_POST_PASSING_PROCESS}"
                                      class="form-button status">Post passing in progress</span>
                                <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED}"
                                      class="form-button status">Re-opened</span>
                                <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_COMPLETED}"
                                      class="form-button status">Completed</span>
                                <span ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED}"
                                      class="form-button status">Issue reported</span>

                                <div class="row">
                                    <input ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_COMPLETED}"
                                           ng-click="epca2.reopenDigitalAsset($event,'${asset._id}')" type="button"
                                           class="form-button white-button white-border-button mg-b-15"
                                           value="Re-open asset"/>
                                </div>
                                <div class="row">
                                    <input ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_ACTIVE} && ${currentUser.status === STATUS.numeric.POST_PASSING_IN_PROGRESS}"
                                           ng-click="epca2.startReportPassing($event, '${asset._id}')" type="button"
                                           class="form-button green-button mg-b-15" value="Get started"/>
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
    }]);
