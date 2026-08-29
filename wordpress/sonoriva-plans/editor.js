/* global window */

(function (blocks, element, blockEditor, serverSideRender) {
    'use strict';
    var createElement = element.createElement;
    var ServerSideRender = serverSideRender.default || serverSideRender;

    blocks.registerBlockType('sonoriva/plans', {
        apiVersion: 2,
        title: 'Forfaits SonoRiva',
        description: 'Affiche les forfaits publics configurés dans SonoRiva.',
        icon: 'tickets-alt',
        category: 'widgets',
        edit: function () {
            return createElement(
                'div',
                blockEditor.useBlockProps(),
                createElement(ServerSideRender, { block: 'sonoriva/plans' })
            );
        },
        save: function () {
            return null;
        }
    });
})(window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.serverSideRender);
