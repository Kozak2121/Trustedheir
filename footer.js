import {STATUS, ARTICLES} from '../lib/constants';

angular
    .module('trustedheir')
    .controller('FooterCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', '$compile', ($scope, $state, $window, $document, $location, $timeout, $compile) => {
        const self = this;
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

        self.showHelpCenter = () => {};
    }]);
