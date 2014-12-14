(function() {
    'use strict';

    ProfileService.$inject = ['api'];
    function ProfileService(api) {

        this.getUserActivity = function(user, maxResults, page) {
            var q = {
                where: {user: user._id},
                sort: '[(\'_created\',-1)]',
                embedded: {user: 1}
            };

            if (maxResults) {
                q.max_results = maxResults;
            }

            if (page > 1) {
                q.page = page;
            }

            return api.activity.query(q);
        };

        this.getUserActivityFiltered = function(maxResults, page) {
            var q = {
                sort: '[(\'_created\',-1)]',
                embedded: {user: 1}
            };

            if (maxResults) {
                q.max_results = maxResults;
            }

            if (page > 1) {
                q.page = page;
            }

            return api.activity.query(q);
        };
    }

    angular.module('superdesk.users.profile', ['superdesk.api', 'superdesk.users'])

        .service('profileService', ProfileService)

        .config(['apiProvider', function(apiProvider) {
            apiProvider.api('activity', {
                type: 'http',
                backend: {rel: 'activity'}
            });
        }])

        .config(['superdeskProvider', 'assetProvider', function(superdeskProvider, asset) {
            superdeskProvider.activity('/profile/', {
                label: gettext('My Profile'),
                controller: 'UserEditController',
                templateUrl: asset.templateUrl('superdesk-users/views/edit.html'),
                resolve: {
                    user: ['session', 'api', function(session, api) {
                        return session.getIdentity().then(function(identity) {
                            return api.get(identity._links.self.href);
                        });
                    }]
                }
            });
        }])

        .directive('sdUserActivity', ['profileService', 'asset', function(profileService, asset) {
            return {
                restrict: 'A',
                replace: true,
                templateUrl: asset.templateUrl('superdesk-users/views/activity-feed.html'),
                scope: {
                    user: '='
                },
                link: function(scope, element, attrs) {
                    var page = 1;
                    var maxResults = 5;

                    scope.$watch('user', function() {
                        profileService.getUserActivity(scope.user, maxResults).then(function(list) {
                            scope.activityFeed = list;
                        });
                    });

                    scope.loadMore = function() {
                        page++;
                        profileService.getUserActivity(scope.user, maxResults, page).then(function(next) {
                            Array.prototype.push.apply(scope.activityFeed._items, next._items);
                            scope.activityFeed._links = next._links;
                        });
                    };
                }
            };
        }]);
})();
