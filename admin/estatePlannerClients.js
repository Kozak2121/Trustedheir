import {STATUS} from '../../lib/constants';
import moment from 'moment';

angular
    .module('trustedheir')
    .controller('AdminEstatePlannerClientsCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        document.title = "Estate Planners | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        const $estatePlannerId = $stateParams.id;
        self.today = moment(new Date()).format('MM/DD/YYYY');
        self.status = STATUS.literal;
        self.dateOfClose = null;
        self.isMostRecent = true;
        self.isKeptClientAccounts = true;
        self.currentDate = (new Date()).getTime();
        const page = 3;
        const initialQuery = {
            skip: 0,
            limit: page
        };
        self.isLoading = false;
        if (currentUser) {
            Meteor.call('getUserById', $estatePlannerId, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (cb.status) {
                        for (let key in STATUS.numeric) {
                            if (cb.status === STATUS.numeric[key]) {
                                cb.status = STATUS.literal[key];
                            }
                        }
                    } else cb.status = 'No info';
                    self.estatePlanner = cb;

                    Meteor.call('getClientsWithAssetsAndTrustees', $estatePlannerId, initialQuery, (err, cb) => {
                        $timeout(() => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            cb.clients.forEach(client => {
                                if (client.status) {
                                    for (let key in STATUS.numeric) {
                                        if (client.status === STATUS.numeric[key]) {
                                            client.status = STATUS.literal[key];
                                        }
                                    }
                                } else client.status = 'No info';
                            });
                            self.clients = cb.clients;
                            self.countOfAllItems = cb.countOfAllItems;
                            self.estatePlanner.totalClients = cb.clients.length;
                            $scope.$apply();
                        })
                    });
                })
            });
        }

        self.getMoreItems = () => {
            if (self.clients && self.clients.length > 0) {
                self.isLoading = true;
                const len = self.clients.length;
                const query = {
                    skip: len,
                    limit: page
                };
                Meteor.call('getClientsWithAssetsAndTrustees', $estatePlannerId, query, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    cb.clients.forEach(client => {
                        if (client.status) {
                            for (let key in STATUS.numeric) {
                                if (client.status === STATUS.numeric[key]) {
                                    client.status = STATUS.literal[key];
                                }
                            }
                        } else client.status = 'No info';
                    });
                    self.oldClients = self.clients;
                    self.clients = self.oldClients.concat(cb.clients);
                    self.isLoading = false;
                    $scope.$apply();
                });
            }
        };

        self.selectSorting = isMostRecent => {
            if (isMostRecent) {
                self.isMostRecent = true;
                self.clients.sort((a, b) => {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            } else {
                self.isMostRecent = false;
                self.clients.sort((a, b) => {
                    return a.profile.firstName.toLowerCase().localeCompare(b.profile.firstName.toLowerCase()) ||
                        a.profile.lastName.toLowerCase().localeCompare(b.profile.lastName.toLowerCase()) ||
                        new Date(b.createdAt) - new Date(a.createdAt) || 0;
                });
            }
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
                            Meteor.call('getUserById', $estatePlannerId, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    if (cb.status) {
                                        for (const key in STATUS.numeric) {
                                            if (cb.status === STATUS.numeric[key]) {
                                                cb.status = STATUS.literal[key];
                                            }
                                        }
                                    } else cb.status = 'No info';
                                    self.estatePlanner = cb;
                                })
                            });
                            toastr.success(cb.message, 'SUCCESS');
                            $scope.$apply();
                        });
                    }
                }
            });
        };

        self.cancelEstatePlannerAccountImmediately = () => {
            Meteor.call('cancelEstatePlannerAccountImmediately', $estatePlannerId, self.isKeptClientAccounts, (err, cb) => {
                if (err) {
                    return toastr.error(err.message, 'ERROR');
                }
                bootbox.hideAll();
                if (self.isKeptClientAccounts) {
                    Meteor.call('getUserById', $estatePlannerId, (err, cb) => {
                        $timeout(() => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            if (cb.status) {
                                for (const key in STATUS.numeric) {
                                    if (cb.status === STATUS.numeric[key]) {
                                        cb.status = STATUS.literal[key];
                                    }
                                }
                            } else cb.status = 'No info';
                            self.estatePlanner = cb;
                        })
                    });
                    toastr.success(cb.message, 'SUCCESS');
                } else {
                    Meteor.call('closeAllClients', $estatePlannerId, (err, cb) => {
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        Meteor.call('getUserById', $estatePlannerId, (err, cb) => {
                            $timeout(() => {
                                if (err) {
                                    return toastr.error(err.message, 'ERROR');
                                }
                                if (cb.status) {
                                    for (const key in STATUS.numeric) {
                                        if (cb.status === STATUS.numeric[key]) {
                                            cb.status = STATUS.literal[key];
                                        }
                                    }
                                } else cb.status = 'No info';
                                self.estatePlanner = cb;
                                Meteor.call('getClientsWithAssetsAndTrustees', $estatePlannerId, (err, cb) => {
                                    $timeout(() => {
                                        if (err) {
                                            return toastr.error(err.message, 'ERROR');
                                        }
                                        cb.clients.forEach(client => {
                                            if (client.status) {
                                                for (const key in STATUS.numeric) {
                                                    if (client.status === STATUS.numeric[key]) {
                                                        client.status = STATUS.literal[key];
                                                    }
                                                }
                                            } else client.status = 'No info';
                                        });
                                        self.clients = cb.clients;
                                        self.countOfAllItems = cb.countOfAllItems;
                                        self.estatePlanner.totalClients = cb.clients.length;
                                    })
                                });
                            })
                        });
                        toastr.success(cb.message, 'SUCCESS');
                    })
                }
                $scope.$apply();
            })
        };

        self.formatDate = date => moment(date).format('ll');

        self.cancelEstatePlannerAccountOnDate = () => {
            if (self.dateOfClose) {
                Meteor.call('cancelEstatePlannerAccountOnDate', $estatePlannerId, new Date(self.dateOfClose), self.isKeptClientAccounts, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    bootbox.hideAll();
                    if (self.isKeptClientAccounts) {
                        Meteor.call('getUserById', $estatePlannerId, (err, cb) => {
                            $timeout(() => {
                                if (err) {
                                    return toastr.error(err.message, 'ERROR');
                                }
                                if (cb.status) {
                                    for (const key in STATUS.numeric) {
                                        if (cb.status === STATUS.numeric[key]) {
                                            cb.status = STATUS.literal[key];
                                        }
                                    }
                                } else cb.status = 'No info';
                                self.estatePlanner = cb;
                            })
                        });
                        toastr.success(cb.message, 'SUCCESS');
                    } else {
                        Meteor.call('closeAllClients', $estatePlannerId, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('getUserById', $estatePlannerId, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    if (cb.status) {
                                        for (const key in STATUS.numeric) {
                                            if (cb.status === STATUS.numeric[key]) {
                                                cb.status = STATUS.literal[key];
                                            }
                                        }
                                    } else cb.status = 'No info';
                                    self.estatePlanner = cb;
                                    Meteor.call('getClientsWithAssetsAndTrustees', $estatePlannerId, (err, cb) => {
                                        $timeout(() => {
                                            if (err) {
                                                return toastr.error(err.message, 'ERROR');
                                            }
                                            cb.clients.forEach(client => {
                                                if (client.status) {
                                                    for (const key in STATUS.numeric) {
                                                        if (client.status === STATUS.numeric[key]) {
                                                            client.status = STATUS.literal[key];
                                                        }
                                                    }
                                                } else client.status = 'No info';
                                            });
                                            self.clients = cb.clients;
                                            self.countOfAllItems = cb.countOfAllItems;
                                            self.estatePlanner.totalClients = cb.clients.length;
                                        })
                                    });
                                })
                            });
                            toastr.success(cb.message, 'SUCCESS');
                        });
                    }
                    $scope.$apply();
                })
            }
        };

        self.cancelAccount = estatePlanner => {
            const profile = estatePlanner.profile;
            const tplCrop = `<div class="digital-asset auto-height">
                            <div class="digital-asset__titleBlueBold">You are about to cancel the following account:</div>
                            <div class="digital-asset__titleGrayLight">${profile.firstName} ${profile.lastName}</div>
                            <div class="digital-asset__titleGrayLight">Cancel the account on the following date:</div>
                            <div class="digital-asset__titleGrayLight"> 
                            <input placeholder="Date of close" min-date="true" class="form-control" name="dateOfClose" 
                                           type="text" ng-model="aepc2.dateOfClose" datepicker/>
                          
                            </div>
                            <div style="margin-top: 15px;">
                                <input ng-disabled="aepc2.dateOfClose === null" ng-click="aepc2.cancelEstatePlannerAccountOnDate()" type="button" class="form-button white-border red-button" value="Cancel on the following date">
                            </div>
                            <div class="btn-tag-wrapper">
                                <button  ng-click="aepc2.isKeptClientAccounts=true" ng-class="{active: aepc2.isKeptClientAccounts}"  class="form-button white-border red-button">
                                   Keep Client Accounts
                                </button>
                                <button  ng-click="aepc2.isKeptClientAccounts=false" ng-class="{active: !aepc2.isKeptClientAccounts}"  class="form-button white-border red-button">
                                   Close Client Accounts
                                </button>
                            </div>
                            <div style="margin-top: 15px;">  
                            <input ng-click="aepc2.cancelEstatePlannerAccountImmediately()" type="button" class="form-button white-border red-button" value="Cancel Immediately">
                                
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

        self.suspendAccount = estatePlanner => {
            const profile = estatePlanner.profile;
            bootbox.confirm({
                message: `You are going to suspend account of ${profile.firstName} ${profile.lastName}`,
                buttons: {
                    confirm: {
                        label: 'Yes, suspend account',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        Meteor.call('suspendEstatePlannerAccount', estatePlanner._id, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('getUserById', $estatePlannerId, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    if (cb.status) {
                                        for (const key in STATUS.numeric) {
                                            if (cb.status === STATUS.numeric[key]) {
                                                cb.status = STATUS.literal[key];
                                            }
                                        }
                                    } else cb.status = 'No info';
                                    self.estatePlanner = cb;
                                })
                            });
                            self.estatePlanner = cb.estatePlanner;
                            toastr.success(cb.message, 'SUCCESS');
                            $scope.$apply();
                        })
                    }
                }
            });
        };

        self.editEstatePlannerClient = id => $location.path(`/admin/edit-client/${id}`).search({estatePlannerId: $estatePlannerId});

        self.editEstatePlanner = id => $location.path(`/admin/edit-estate-planner/${id}`);

        self.addClient = id => $location.path(`/admin/add-client`).search({estatePlannerId: id});

        self.removeClient = (e, client) => {
            e.stopPropagation();
            const profile = client.profile;
            bootbox.confirm({
                title: 'Delete client?',
                message: `Deleting a Client ${profile.firstName} ${profile.lastName} will permanently delete their digital estate plan and the Client will no longer be able to access their account.`,
                buttons: {
                    confirm: {
                        label: 'Yes, delete client',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No, keep client',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        self.isLoading = true;
                        const len = self.clients.length;
                        const query = {
                            skip: 0,
                            limit: len
                        };
                        Meteor.call('removeClient', client, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('getClientsWithAssetsAndTrustees', $estatePlannerId, query, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    cb.clients.forEach(client => {
                                        if (client.status) {
                                            for (const key in STATUS.numeric) {
                                                if (client.status === STATUS.numeric[key]) {
                                                    client.status = STATUS.literal[key];
                                                }
                                            }
                                        } else client.status = 'No info';
                                    });
                                    self.clients = cb.clients;
                                    self.countOfAllItems = cb.countOfAllItems;
                                    self.isLoading = false;
                                    toastr.success(`You've successfully deleted ${profile.firstName} ${profile.lastName} account.`, 'SUCCESS');
                                    $scope.$apply();
                                });
                            });
                        });
                    }
                }
            });
        };

        self.reActivateClient = (e, client) => {
            e.stopPropagation();
            const profile = client.profile;
            bootbox.confirm({
                title: 'Re-activate Client?',
                message: `Do you really want to Re-activate Client?`,
                buttons: {
                    confirm: {
                        label: 'Yes, re-activate Client',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: "No, don't re-activate Client",
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        self.isLoading = true;
                        const len = self.clients.length;
                        const query = {
                            skip: 0,
                            limit: len
                        };
                        Meteor.call('reActivateClient', client, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Meteor.call('getClientsWithAssetsAndTrustees', $estatePlannerId, query, (err, cb) => {
                                $timeout(() => {
                                    if (err) {
                                        return toastr.error(err.message, 'ERROR');
                                    }
                                    cb.clients.forEach(client => {
                                        if (client.status) {
                                            for (let key in STATUS.numeric) {
                                                if (client.status === STATUS.numeric[key]) {
                                                    client.status = STATUS.literal[key];
                                                }
                                            }
                                        } else client.status = 'No info';
                                    });
                                    self.clients = cb.clients;
                                    self.isLoading = false;
                                    self.countOfAllItems = cb.countOfAllItems;
                                    self.estatePlanner.totalClients = cb.clients.length;
                                })
                            });
                            toastr.success(`You've successfully re-activated ${profile.firstName} ${profile.lastName} account.`, 'SUCCESS');
                            $scope.$apply();
                        });
                    }
                }
            });
        };
    }]);
