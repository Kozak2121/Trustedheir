import {STATUS} from '../../lib/constants';
import moment from 'moment';

angular
    .module('trustedheir')
    .controller('AdminEstatePlannerCenterCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Estate Planner Center | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        self.status = STATUS.literal;
        self.isMostRecent = true;
        self.currentDate = (new Date()).getTime();
        const page = 3;
        const initialQuery = {
            skip: 0,
            limit: page
        };
        self.isLoading = false;
        if (currentUser) {
            Meteor.call('getEstatePlanners', initialQuery, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    cb.estatePlanners.forEach(estatePlanner => {
                        if (estatePlanner.status) {
                            for (let key in STATUS.numeric) {
                                if (estatePlanner.status === STATUS.numeric[key]) {
                                    estatePlanner.status = STATUS.literal[key];
                                }
                            }
                        } else estatePlanner.status = 'No info';
                    });
                    self.countOfAllItems = cb.countOfAllItems;
                    self.sortByDateOfClose(cb.estatePlanners);
                    $scope.$apply();
                })
            });
        }

        self.getMoreItems = () => {
            if (self.estatePlanners && self.estatePlanners.length > 0) {
                self.isLoading = true;
                const len = self.estatePlanners.length;
                const query = {
                    skip: len,
                    limit: page
                };
                Meteor.call('getEstatePlanners', query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    cb.estatePlanners.forEach(estatePlanner => {
                        if (estatePlanner.status) {
                            for (let key in STATUS.numeric) {
                                if (estatePlanner.status === STATUS.numeric[key]) {
                                    estatePlanner.status = STATUS.literal[key];
                                }
                            }
                        } else estatePlanner.status = 'No info';
                    });

                    self.oldEstatePlanners = self.estatePlanners;
                    self.estatePlanners = self.oldEstatePlanners.concat(cb.estatePlanners);
                    self.isLoading = false;
                    $scope.$apply();
                });
            }
        };

        self.sortByDateOfClose = estatePlanners => {
            const estatePlannersWithDateOfCloseOrDateOfSuspension = estatePlanners.filter(estatePlanner => {
                return estatePlanner.dateOfClose || estatePlanner.dateOfSuspension
            });
            const estatePlannersWithoutDateOfCloseOrDateOfSuspension = estatePlanners.filter(estatePlanner => {
                return !estatePlanner.dateOfClose && !estatePlanner.dateOfSuspension
            });
            self.estatePlanners = estatePlannersWithoutDateOfCloseOrDateOfSuspension.concat(estatePlannersWithDateOfCloseOrDateOfSuspension);
        };

        self.formatDate = date => {
            return moment(date).format('ll')
        };

        self.editEstatePlanner = id => {
            $location.path(`/admin/edit-estate-planner/${id}`);
        };

        self.selectSorting = isMostRecent => {
            if (isMostRecent) {
                self.isMostRecent = true;
                self.estatePlanners.sort((a, b) => {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                self.sortByDateOfClose(self.estatePlanners);
            } else {
                self.isMostRecent = false;
                self.estatePlanners.sort((a, b) => {
                    return a.profile.firstName.toLowerCase().localeCompare(b.profile.firstName.toLowerCase()) ||
                        a.profile.lastName.toLowerCase().localeCompare(b.profile.lastName.toLowerCase()) ||
                        new Date(b.createdAt) - new Date(a.createdAt) || 0;
                });
                self.sortByDateOfClose(self.estatePlanners);
            }
        };

        self.addEstatePlanner = () => {
            $location.path('/admin/add-estate-planner');
        };

        self.reActivateEstatePlanner = (e, estatePlanner) => {
            e.stopPropagation();

            const profile = estatePlanner.profile;
            bootbox.confirm({
                title: 'ReActivate Estate Planner?',
                message: `ReActivation of Estate Planner ${profile.firstName} ${profile.lastName}.`,
                buttons: {
                    confirm: {
                        label: 'Yes, reActivate client',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        Meteor.call('reActivateEstatePlannerAccount', estatePlanner._id, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            bootbox.hideAll();
                            Meteor.call('getEstatePlanners', (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    cb.estatePlanners.forEach(estatePlanner => {
                                        if (estatePlanner.status) {
                                            for (let key in STATUS.numeric) {
                                                if (estatePlanner.status === STATUS.numeric[key]) {
                                                    estatePlanner.status = STATUS.literal[key];
                                                }
                                            }
                                        } else estatePlanner.status = 'No info';
                                    });
                                    self.sortByDateOfClose(cb.estatePlanners);
                                })
                            });
                            toastr.success(cb.message, 'SUCCESS');
                            $scope.$apply();
                        });
                    }
                }
            });
        };

        self.removeEstatePlanner = (e, estatePlanner) => {
            e.stopPropagation();
            const profile = estatePlanner.profile;
            bootbox.confirm({
                title: 'Delete Estate Planner?',
                message: `Deleting a Estate Planner ${profile.firstName} ${profile.lastName} will permanently delete their digital estate plan and the Client will no longer be able to access their account.`,
                buttons: {
                    confirm: {
                        label: 'Yes, delete Estate Planner',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No, keep Estate Planner',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        Meteor.call('removeEstatePlanner', estatePlanner._id, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('getEstatePlanners', (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    cb.estatePlanners.forEach(estatePlanner => {
                                        if (estatePlanner.status) {
                                            for (const key in STATUS.numeric) {
                                                if (estatePlanner.status === STATUS.numeric[key]) {
                                                    estatePlanner.status = STATUS.literal[key];
                                                }
                                            }
                                        } else estatePlanner.status = 'No info';
                                    });
                                    self.sortByDateOfClose(cb.estatePlanners);
                                })
                            });
                            toastr.success(`You've successfully deleted ${profile.firstName} ${profile.lastName} account.`, 'SUCCESS');
                            $scope.$apply();
                        });
                    }
                }
            });
        };
    }]);
