import {CATEGORIES, STATUS} from '../../lib/constants';
import {detectWindowSize} from '../../lib/helpers';

angular
    .module('trustedheir')
    .controller('AdminDigitalAssetsCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        document.title = "Digital Assets | TrustedHeir";
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
                Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
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
                const tplCrop = `<li ng-class="{active: ada.category==='${category}'}" ng-click="ada.selectCategory($event)"> ${category} </li>`;
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

        self.addDigitalAsset = () => {
            $location.path('/client/add-digital-asset');
        };

        self.reActivateDigitalAsset = (e, assetId) => {
            "use strict";
            e.stopPropagation();
            bootbox.hideAll();
            self.isLoading = true;
            const len = self.assets.length;
            const query = {
                skip: 0,
                limit: len
            };
            Meteor.call('changeAssetStatus', assetId, STATUS.numeric.DIGITAL_ASSET_ACTIVE, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                toastr.success(cb.message, 'SUCCESS');
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

        self.editDigitalAsset = (e, id) => {
            e.stopPropagation();
            bootbox.hideAll();
            $location.path(`/admin/edit-digital-asset/${id}`).search({clientId: $clientId});
        };

        self.removeDigitalAsset = (e, assetId) => {
            e.stopPropagation();
            bootbox.hideAll();
            let asset = {};
            self.assets.forEach((item) => {
                if (assetId === item._id) asset = item;
            });
            let tplCrop = `<div style="margin-bottom: 30px;" class="digital-asset__titleBlueBold text-align-center">You are going to delete <br> ${asset.name}</div>
                        <div class="text-align-center">
                            <div class="digital-asset__titleGrayBold">Digital Trustee</div>`;
            for (let i = 0; i < asset.trustees.length; i++) {
                tplCrop += `<div class="digital-asset__titleGrayLight">
                                ${asset.trustees[i].profile.firstName} ${asset.trustees[i].profile.lastName}
                            </div>`;
            }
            tplCrop += `<div class="digital-asset__titleGrayBold">Website</div>
                            <div class="digital-asset__titleGrayLight">${asset.website}</div>
                            <div class="digital-asset__titleGrayBold">Notes</div>
                            <div class="digital-asset__titleGrayLight">${asset.notes}</div>
                        </div>`;
            const template = angular.element(tplCrop);
            const linkFn = $compile(template);
            const html = linkFn($scope);

            bootbox.confirm({
                message: html,
                buttons: {
                    confirm: {
                        label: 'Yes, delete digital asset',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No, keep digital asset',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        self.isLoading = true;
                        const len = self.assets.length;
                        const query = {
                            skip: 0,
                            limit: len
                        };
                        Meteor.call('removeAsset', asset._id, (err) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('getAssetsByClientId', $clientId, currentUser.roles, query, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    self.assets = cb.finalAssets;
                                    self.isLoading = false;
                                    self.countOfAllItems = cb.countOfAllItems;
                                    toastr.success(`You've successfully deleted digital asset.`, 'SUCCESS');
                                    $scope.$apply();
                                });
                            });
                        });

                    }
                }
            });
        };

        self.showDigitalAssetDetail = asset => {
            let trustees = ``;
            let i = asset.trustees.length;
            for (; i--;) {
                trustees += `<div class="digital-asset__titleGrayLight">${asset.trustees[i].profile.firstName} ${asset.trustees[i].profile.lastName}</div>`;
            }
            const tplCrop = `<div class="text-align-center">                            
                            <div class="asset-image">
                                <img src="${asset.logo ? asset.logo : '/icons/no-logo.png'}">
                            </div>
                            <div class="digital-asset__titleBlueBold">${asset.name}</div>
                            <div class="digital-asset__titleGrayBold">Account login</div>
                            <div class="digital-asset__titleGrayLight">${asset.login}</div>
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
                                <input  ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_ACTIVE}"
                                               ng-click="ada.editDigitalAsset($event, '${asset._id}');"  type="button" class="form-button white-button mg-b-15" value="Edit digital asset"/>
                                </div>
                            <div class="row">
                            <input  ng-if="${asset.status} === ${self.status.DIGITAL_ASSET_ACTIVE}"
                                               ng-click="ada.removeDigitalAsset($event,'${asset._id}');" type="button" class="form-button white-button white-border-button mg-b-15" value="Delete digital asset"/>
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
