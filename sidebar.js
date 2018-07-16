angular
    .module('trustedheir')
    .controller('SidebarCtrl', ['$scope', '$state', '$window', '$document', '$location', ($scope, $state, $window, $document, $location) => {
        const self = this;
        const currentUser = Session.get('currentUser');
        self.currentRole = Session.get('currentMultipleRole') ? Session.get('currentMultipleRole').role : null;
        switch ((currentUser && $location.path().substring(1) !== 'estate-planner/add-payment-info') && currentUser.roles.length === 1 ? currentUser.roles[0] : currentUser.roles.length > 1 ? self.currentRole : null) {
            case 'admin':
                self.navLinks = [
                    {
                        url: 'admin/estate-planner-center',
                        linkText: 'Estate Planners',
                        className: 'clients-image'
                    },
                    {
                        url: 'admin/account',
                        linkText: 'Account',
                        className: 'account-image'
                    }
                ];
                break;
            case 'estatePlanner':
                self.navLinks = [
                    {
                        url: 'estate-planner/client-center',
                        linkText: 'Clients',
                        className: 'clients-image'
                    }, {
                        url: 'estate-planner/billing',
                        linkText: 'Billing',
                        className: 'billing-image'
                    }, {
                        url: 'estate-planner/account',
                        linkText: 'Account',
                        className: 'account-image'
                    }
                ];
                break;
            case 'client':
                self.navLinks = [{
                    url: 'client/digital-assets',
                    linkText: 'Digital Assets',
                    className: 'assets-image'
                }, {
                    url: 'client/digital-trustees',
                    linkText: 'Digital Trustees',
                    className: 'executor-image'
                },
                    {
                        url: 'client/account',
                        linkText: 'Account',
                        className: 'account-image'
                    },
                ];
                break;
            case 'trustee':
                self.navLinks = [
                    {
                        url: 'trustee/clients',
                        linkText: 'Clients',
                        className: 'clients-image'
                    }, {
                        url: 'trustee/digital-assets',
                        linkText: 'Digital Assets',
                        className: 'assets-image'
                    }, {
                        url: 'trustee/account',
                        linkText: 'Account',
                        className: 'account-image'
                    }
                ];
                break;
            default:
                self.navLinks = [];
                break;
        }

        self.navClass = (page) => {
            let currentRoute = $location.path().substring(1) || 'home';
            switch (page) {
                case 'admin/estate-planner-center':
                    (['admin/estate-planner-center', 'admin/add-estate-planner'].indexOf(currentRoute) > -1 || currentRoute.match(/admin\/edit-estate-planner\//i) || currentRoute.match(/admin\/estate-planner-center\//i) || currentRoute.match(/admin\/edit-client\//i) || currentRoute.match(/admin\/add-client/i) || currentRoute.match(/admin\/digital-assets\//i) || currentRoute.match(/admin\/edit-digital-asset\//i)) ? className = 'active' : className = '';
                    break;
                case 'admin/account':
                    (['admin/account'].indexOf(currentRoute) > -1) ? className = 'active' : className = '';
                    break;
                case 'estate-planner/client-center':
                    (['estate-planner/client-center', 'estate-planner/add-client'].indexOf(currentRoute) > -1 || currentRoute.match(/estate-planner\/edit-client\//i) || currentRoute.match(/estate-planner\/client-center\//i) || currentRoute.match(/estate-planner\/report-passing\//i)) ? className = 'active' : className = '';
                    break;
                case 'estate-planner/billing':
                    (['estate-planner/billing'].indexOf(currentRoute) > -1) ? className = 'active' : className = '';
                    break;
                case 'estate-planner/account':
                    (['estate-planner/account'].indexOf(currentRoute) > -1) ? className = 'active' : className = '';
                    break;
                case 'client/digital-assets':
                    (['client/digital-assets', 'client/add-digital-asset'].indexOf(currentRoute) > -1 || currentRoute.match(/client\/edit-digital-asset\//i)) ? className = 'active' : className = '';
                    break;
                case 'client/digital-trustees':
                    (['client/digital-trustees', 'client/add-trustee'].indexOf(currentRoute) > -1 || currentRoute.match(/client\/edit-trustee\//i) || currentRoute.match(/client\/digital-trustees\//i)) ? className = 'active' : className = '';
                    break;
                case 'client/account':
                    (['client/account'].indexOf(currentRoute) > -1) ? className = 'active' : className = '';
                    break;
                case 'trustee/digital-assets':
                    (['trustee/digital-assets'].indexOf(currentRoute) > -1 || currentRoute.match(/trustee\/digital-asset\//i)) || currentRoute.match(/trustee\/digital-assets\//i) ? className = 'active' : className = '';
                    break;
                case 'trustee/clients':
                    (['trustee/clients'].indexOf(currentRoute) > -1) ? className = 'active' : className = '';
                    break;
                case 'trustee/account':
                    (['trustee/account'].indexOf(currentRoute) > -1) ? className = 'active' : className = '';
                    break;
                default:
                    className = '';
            }
            return className;
        };

    }]);
