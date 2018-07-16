import {CATEGORIES, STATUS} from '../../lib/constants';
import {detectWindowSize} from '../../lib/helpers';

angular
    .module('trustedheir')
    .controller('AdminEditDigitalAssetCtrl', ['$http', '$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($http, $stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        document.title = "Edit Digital Asset | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        self.category = '';
        self.categoryWarning = false;
        self.allCategories = CATEGORIES;
        self.status = STATUS.numeric;
        self.selectedTrustees = [];
        self.selectedTrusteesWithOrder = [];
        self.showSearchCompanyList = false;
        self.isBigResolution = false;
        self.isEnterPressed = false;

        self.generateHiddenCategories = () => {
            let scope = $scope.$new();
            angular.element('#categories-list').html("");
            self.hiddenCategories.forEach(category => {
                const tplCrop = `<li ng-class="{active: aeda.category==='${category}'}" ng-click="aeda.selectCategory($event)"> ${category} </li>`;
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
                self.splitCategories();
            }
            self.splitCategories();
            $scope.$digest();
        });

        self.generateHiddenCategories();

        self.selectCategory = e => {
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
        };

        self.openCategoryList = () => {
            angular.element('#categories-list').show();
        };

        $('.btn-tag-link').on('blur', e => {
            setTimeout(() => {
                angular.element('#categories-list').hide();
            }, 200);
        });

        if (currentUser) {
            Meteor.call('getAssetById', $stateParams.id, (err, asset) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (asset.status !== self.status.DIGITAL_ASSET_ACTIVE) {
                        toastr.error('You can not edit this digital asset', 'ERROR');
                        $location.path(`/admin/digital-assets/${$location.search().clientId}`).search({});
                    }
                    self.asset = asset;
                    self.asset.confirmPassword = self.asset.password;
                    self.category = self.asset.category;
                    Meteor.call('getTrusteesByClientId', $location.search().clientId, (err, cb) => {
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        self.trustees = [];
                        const orderedTrustees = [];
                        if (self.asset.trusteeId) self.asset.trusteeId.forEach(trusteeId => {
                            cb.trustees.forEach(trustee => {
                                if (trusteeId._id === trustee._id) {
                                    orderedTrustees.push(trustee);
                                    let index = cb.trustees.indexOf(trustee);
                                    if (index > -1) {
                                        cb.trustees.splice(index, 1);
                                    }
                                }
                            });
                        });
                        self.trustees = orderedTrustees.concat(cb.trustees);
                        $scope.$apply();
                        let i = 0;
                        self.trustees.forEach(trustee => {
                            if (trustee.assetId && trustee.assetId.includes($stateParams.id)) {
                                self.selectedTrustees.push(trustee._id);
                                self.selectedTrusteesWithOrder.push({
                                    order: i,
                                    _id: trustee._id
                                });
                                i++;
                            }
                        });
                    });
                });
            });
        }

        self.sortableOptions = sortableTrustees => {
            self.selectedTrusteesWithOrder = [];
            if (sortableTrustees && self.selectedTrustees) {
                let i = 0;
                sortableTrustees.forEach(sortTrustee => {
                    self.selectedTrustees.forEach(trusteeId => {
                        if (sortTrustee._id === trusteeId) {
                            self.selectedTrusteesWithOrder.push({
                                order: i,
                                _id: trusteeId
                            });
                            i++;
                        }
                    });
                });
            }
        };

        self.searchCompany = e => {
            if (e.keyCode !== 40 && e.keyCode !== 38) {
                const delay = 400;
                const lastKeyUp = e.timeStamp;
                const querySearchCompany = e.currentTarget.value.trim();
                if (e.timeStamp - lastKeyUp > delay) {
                    self.clearbitSearch(querySearchCompany);
                } else {
                    cb = $timeout(self.clearbitSearch(querySearchCompany), delay)
                }
            }
        };

        $($document).on('keydown', (e) => {
            const selector = $('#searchCompanyList').find('.selected');
            if (e.keyCode === 40) {
                if (selector.length === 0) {
                    $('#searchCompanyList li').first().addClass('selected')
                } else {
                    if (selector.next('li').length !== 0) selector.removeClass('selected').next().addClass('selected');
                }
            } else if (e.keyCode === 38) {
                if (selector.length === 0) {
                    $('#searchCompanyList li').first().addClass('selected')
                } else {
                    if (selector.prev('li').length !== 0) selector.removeClass('selected').prev().addClass('selected');
                }
            } else if (e.keyCode === 13) {
                e.preventDefault();
                if (selector.length !== 0) {
                    self.isEnterPressed = true;
                    self.asset.logo = selector.find('.search-company-logo').attr('src');
                    self.asset.name = selector.find('.search-company-name').text();
                    self.asset.website = selector.find('.search-company-domain').text();
                    setTimeout(() => {
                        self.isEnterPressed = false;
                    }, 400);
                    self.showSearchCompanyList = false;
                }
            }
        });

        self.clearbitSearch = querySearchCompany => {
            angular.element('#searchCompanyList').html('');
            self.showSearchCompanyList = true;
            if (self.asset.name) {
                $http.get(`https://autocomplete.clearbit.com/v1/companies/suggest?query=:${querySearchCompany}`)
                    .then(result => {
                        const companies = result.data;
                        const scope = $scope.$new();
                        companies.forEach(company => {
                            const tplCrop = `<li ng-click="aeda.setCompany($event)" data-search-company-li=true>
                                                <span class="search-company-logo-wrapper">
                                                <img class="search-company-logo" src="${company.logo}" />
                                                </span>
                                                <span class="search-company-name">${company.name}</span>
                                                <span class="search-company-domain">${company.domain}</span>
                                            </li>`;
                            const template = angular.element(tplCrop);
                            const linkFn = $compile(template)(scope);
                            angular.element('#searchCompanyList').append(linkFn);
                        });
                    });
            }
        };

        self.setCompany = e => {
            const elem = $(e.currentTarget);
            if (elem[0].nodeName === 'LI') {
                self.asset.logo = elem.find('.search-company-logo')[0].src;
                self.asset.website = elem.find('.search-company-domain')[0].innerText;
                self.asset.name = elem.find('.search-company-name')[0].innerText;
            } else {
                $timeout(() => {
                    self.showSearchCompanyList = false;
                }, 200);
            }
        };

        self.selectTrustee = trusteeId => {
            const i = self.selectedTrustees.indexOf(trusteeId);
            if (i !== -1) {
                self.selectedTrustees.splice(i, 1);
            } else {
                self.selectedTrustees.push(trusteeId);
            }
        };

        self.checkAsignedTrustee = trustee => {
            if (self.asset && trustee.assetId) {
                return trustee.assetId.some(assetId => {
                    return assetId === self.asset._id;
                });
            }
        };

        self.updateAsset = (e, asset, newTrusteeForm) => {
            e.preventDefault();
            const assetId = $stateParams.id;
            if (!asset.$valid) {
                $scope.assetForm.name.$setDirty();
                $scope.assetForm.login.$setDirty();
                $scope.assetForm.password.$setDirty();
                $scope.assetForm.confirmPassword.$setDirty();
                $scope.assetForm.website.$setDirty();
                return self.showWarning(`Please, fill all asset's fields`);
            } else {
                let updatedAsset = {
                    category: self.category,
                    name: asset.name.$viewValue,
                    logo: self.asset.logo,
                    login: asset.login.$viewValue,
                    website: asset.website.$viewValue,
                    notes: asset.notes.$viewValue || '',
                    createdAt: new Date(),
                    clientId: $location.search().clientId
                };
                Meteor.call('updateAsset', assetId, updatedAsset, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    const assetMsg = cb.message;
                    const clientId = cb.clientId;
                    let trusteeArray = [];
                    if (self.selectedTrusteesWithOrder.length) {
                        trusteeArray = self.selectedTrusteesWithOrder
                    }

                    if (newTrusteeForm.$valid && assetId) {
                        let newTrustee = {
                            username: `${newTrusteeForm.firstName.$viewValue} ${newTrusteeForm.lastName.$viewValue} _${Random.id()}`,
                            email: newTrusteeForm.email.$viewValue,
                            password: Random.id(),
                            profile: {
                                firstName: newTrusteeForm.firstName.$viewValue,
                                lastName: newTrusteeForm.lastName.$viewValue,
                                email: newTrusteeForm.email.$viewValue,
                                note: newTrusteeForm.note.$viewValue
                            }
                        };
                        Accounts.createUser(newTrustee, (err, cb) => {
                            if (err && err.reason === 'Email already exists.') {
                                Object.assign(newTrustee, {assetId: assetId});
                                Meteor.call('addExistingTrustee', newTrustee, clientId, (err, cb) => {
                                    "use strict";
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    let msg = cb.message;
                                    if (cb.existingTrustee) {
                                        let userId = cb.existingTrustee._id;
                                        let i = trusteeArray.length;
                                        trusteeArray.push({
                                            order: i,
                                            _id: userId
                                        });
                                        Meteor.call('addTrusteesToAsset', trusteeArray, assetId, (err, cb) => {
                                            "use strict";
                                            if (err) {
                                                return toastr.error(err.message, 'ERROR');
                                            }
                                            toastr.success(msg, 'SUCCESS');
                                            $location.path(`/admin/digital-assets/${clientId}`);
                                            $scope.$apply();
                                        });
                                    } else {
                                        toastr.warning(msg, 'WARNING');
                                        $location.path(`/admin/digital-assets/${clientId}`);
                                        $scope.$apply();
                                    }
                                });
                            } else if (err) {
                                return toastr.error(err.message, 'ERROR');
                            } else {
                                let i = trusteeArray.length;
                                trusteeArray.push({
                                    order: i,
                                    _id: Meteor.userId()
                                });
                                Meteor.call('addTrusteesToAsset', trusteeArray, assetId, (err, cb) => {
                                    "use strict";
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    Meteor.call('createTrusteeInvited', Meteor.userId(), newTrustee, clientId, (err, cb) => {
                                        if (err) {
                                            return toastr.error(err.message, 'ERROR');
                                        }
                                        let msg = cb.message;
                                        if (self.selectedTrusteesWithOrder.length) {
                                            Meteor.call('addTrusteeDigitalAsset', self.selectedTrusteesWithOrder, assetId, (err, cb) => {
                                                if (err) {
                                                    return toastr.error(err.message, 'ERROR');
                                                }
                                                toastr.success(assetMsg, 'SUCCESS');
                                                toastr.success(msg, 'SUCCESS');
                                                toastr.success(cb.message, 'SUCCESS');
                                                $location.path(`/admin/digital-assets/${clientId}`);
                                                $scope.$apply();
                                            });
                                        } else {
                                            toastr.success(assetMsg, 'SUCCESS');
                                            toastr.success(msg, 'SUCCESS');
                                            $location.path(`/admin/digital-assets/${clientId}`);
                                            $scope.$apply();
                                        }
                                    });
                                });
                            }
                        });
                    } else if (!newTrusteeForm.$valid && assetId) {
                        if (self.selectedTrusteesWithOrder.length) {
                            Meteor.call('addTrusteesToAsset', trusteeArray, assetId, (err, cb) => {
                                "use strict";
                                if (err) {
                                    return toastr.error(err.message, 'ERROR');
                                }
                                Meteor.call('addTrusteeDigitalAsset', self.selectedTrusteesWithOrder, assetId, (err, cb) => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    toastr.success(assetMsg, 'SUCCESS');
                                    toastr.success(cb.message, 'SUCCESS');
                                    $location.path(`/admin/digital-assets/${clientId}`);
                                    $scope.$apply();
                                });
                            });
                        } else {
                            toastr.success(assetMsg, 'SUCCESS');
                            $location.path(`/admin/digital-assets/${clientId}`);
                            $scope.$apply();
                        }
                    }
                });
            }
        };

        self.showWarning = (warningText) => {
            self.warningText = warningText;
            self.fieldsWarning = true;
            $timeout(() => {
                self.fieldsWarning = false;
            }, 3000);
        };
    }]);
