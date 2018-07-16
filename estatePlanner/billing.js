import {STATUS} from '../../lib/constants';
import moment from 'moment';

angular
    .module('trustedheir')
    .controller('EstatePlannerBillingCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($stateParams, $scope, $state, $window, $document, $location, $timeout, $compile) => {
        document.title = "Billing | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');
        self.status = STATUS.literal;
        self.month = '';
        self.isAllMonthActive = true;
        if (currentUser) {
            Meteor.call('getClientsForLastYear', currentUser._id, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    let i = cb.clientsByMonth.length;
                    for (;i--;) {
                        let j = cb.clientsByMonth[i].length;
                        for (;j--;) {
                            if (cb.clientsByMonth[i][j].status) {
                                for (const key in STATUS.numeric) {
                                    if (cb.clientsByMonth[i][j].status === STATUS.numeric[key]) {
                                        cb.clientsByMonth[i][j].status = STATUS.literal[key];
                                    }
                                }
                            } else cb.clientsByMonth[i].status = 'No info';
                        }
                    }
                    self.subscriptionQuantity = cb.stripeInfo.subscriptionQuantity;
                    self.subscriptionStatus = cb.stripeInfo.subscriptionStatus;
                    self.amount_due = cb.stripeInfo.amount_due / 100;
                    self.due = moment.unix(cb.stripeInfo.period_end).format('LL');
                    self.clientsByMonth = cb.clientsByMonth;
                    self.monthDates = cb.monthDates;
                    const scope = $scope.$new();
                    let tplCrop = `<li ng-class="{active: epb.isAllMonthActive===true}" ng-mousedown="epb.selectMonth($event, true)"> All months</li>`;
                    let template = angular.element(tplCrop);
                    let linkFn = $compile(template)(scope);
                    angular.element('#months-list').append(linkFn);
                    self.monthDatesList = _.clone(self.monthDates, true);
                    self.monthDatesList.reverse().forEach(monthDate => {
                        tplCrop = `<li ng-class="{active: epb.month==='${monthDate.month}'}" ng-mousedown="epb.selectMonth($event)"> ${monthDate.month} </li>`;
                        template = angular.element(tplCrop);
                        linkFn = $compile(template)(scope);
                        angular.element('#months-list').append(linkFn);
                    });
                })
            });
        }

        self.monthFilter = () => {
            if(self.clientsByMonth){
                const result = [];
                self.clientsByMonth.forEach((item, indexInner) => {
                    if(self.monthDates[indexInner].month === self.month  || self.isAllMonthActive) {
                        const month = self.clientsByMonth[indexInner];
                        !self.isAllMonthActive ? month.isCollapsed = true: null;
                        result.push(self.clientsByMonth[indexInner]) ;
                    }
                });
                return result;
            }
        };

        self.selectMonth = (e, isAllMonth) => {
            if (isAllMonth) {
                self.isAllMonthActive = true;
                self.month = null;
            } else {
                self.isAllMonthActive = false;
                self.month = e.currentTarget.innerText;
            }
        };

        self.openMonthsList = () => {
            angular.element('#months-list').show();
        };
        $('.calendar-icon-blue').on('blur', (e) => {
            angular.element('#months-list').hide();
        });
        self.date = moment(Date.now()).format('MMMM YYYY');
        self.endOfMonth = moment(Date.now()).endOf('month').format('MMMM DD, YYYY');
    }]);
