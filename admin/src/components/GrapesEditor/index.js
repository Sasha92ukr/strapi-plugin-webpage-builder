import React, { useEffect, useState } from 'react'; // eslint-disable-line import/no-unresolved
import PropTypes from 'prop-types';
import GrapesJS from 'grapesjs';
import gjsBasicBlocks from 'grapesjs-blocks-basic'; // eslint-disable-line no-unused-vars
import { useStrapi, prefixFileUrlWithBackendUrl } from 'strapi-helper-plugin'; // eslint-disable-line import/no-unresolved
import './assets/scss/main.scss';
import addStrapiPlugin from './grapes-plugins/strapi';
import { strapiPluginRef } from './grapes-plugins/strapi/consts';
import { deviceManagerConfig } from './config/device-manager.config';
import { styleManagerConfig } from './config/style-manager.config';
import { storageManagerConfig } from './config/storage-manager.config';
import { editorConfig } from './config/editor.config';
import './assets/js/fa-shim';
import gjsNavbar from 'grapesjs-navbar'; // eslint-disable-line no-unused-vars
import gjsTabs from 'grapesjs-tabs';
import gjsWebPage from 'grapesjs-preset-webpage';
//import gjsScriptEditor from 'grapesjs-script-editor';
//import grapesjsBootstrap4Blocks from 'grapesjs-bootstrap4-blocks'
import grapesjsRteExtensions from 'grapesjs-rte-extensions'
//import grapesjsComponentCodeEditor from 'grapesjs-component-code-editor'
import grapesjsParserPostcss from  'grapesjs-parser-postcss'
import 'grapesjs-component-code-editor/dist/grapesjs-component-code-editor.min.css';
// DEV note: Many dependencies use FA
// Grapes has an older version
// Strapi* use newer version which wraps icons in svg element
// Doing so breaks grapes' toolbar callbacks
// This dirty argument is here to nest svg in original element
// instead of just replacing
window.FontAwesome.config.autoReplaceSvg = 'nest';

const Editor = ({ onChange, name, value }) => {
  const [mediaLibConfiguration, setMediaLibConfiguration] = useState({ open: false });
  const toggleMediaLib = () =>
    setMediaLibConfiguration((prev) => {
      return { ...prev, open: !prev.open };
    });
  const [editor, setEditor] = useState();
  const [editorConfigured, setEditorConfigured] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const [mediaLibPickedData, setMediaLibPickedData] = useState(null);
  const [onFilePickedListeners, setOnFilePickedListeners] = useState({});
  const [sharedAssetsManager, setSharedAssetsManager] = useState(null);
  const {
    strapi: {
      componentApi: { getComponent },
    },
  } = useStrapi();

  const MediaLibComponent = getComponent('media-library').Component;

  const onMediaLibInputChange = (localData) => {
    if (localData) {
      const { url } = localData;
      setMediaLibPickedData({ ...localData, url: prefixFileUrlWithBackendUrl(url) });
    }
  };

  const onMediaLibClosed = () => {
    if (mediaLibPickedData) {
      const { url, alternativeText, id } = mediaLibPickedData;

      if (onFilePickedListeners && url) {
        const registeredListener = onFilePickedListeners[mediaLibConfiguration.activeImageId];

        if (registeredListener) {
          registeredListener.call({ src: url, alt: alternativeText, strapiId: id });
        }
      }
    }

    setMediaLibConfiguration({ open: false });

    setMediaLibPickedData(null);
  };

  useEffect(() => {
    if (!pluginsLoaded) {
      addStrapiPlugin();
      setPluginsLoaded(true);

      setSharedAssetsManager({
        open: (blockId, galleryId) => {
          setMediaLibConfiguration({ open: true, activeImageId: blockId, selected: { id: galleryId } });
        },
        close: () => onMediaLibClosed(),
        onFilePicked: (fileId, cbk) =>
          setOnFilePickedListeners((previousListeners) => {
            return { ...previousListeners, [fileId]: cbk };
          }),
      });
    }
  }, [setPluginsLoaded]);

  useEffect(() => {
    if (mounted || !pluginsLoaded || !sharedAssetsManager) {
      return;
    }

    // Original props here https://github.com/artf/grapesjs/blob/master/src/editor/config/config.js
    const editor =  GrapesJS.init({
      container: '#gjs',
      height: '500px',
      width: 'auto',
      // Rendered data
      fromElement: true,
      components: (value && value.components) || {},
      style: (value && value.styles) || {},
      storageManager: storageManagerConfig,
      plugins: ['gjs-blocks-basic', 'grapesjs-plugin-forms', 'gjs-navbar', 'grapesjs-tabs', 'gjs-preset-webpage', grapesjsRteExtensions, grapesjsParserPostcss, strapiPluginRef],
      pluginsOpts: {
        'gjs-blocks-basic': {
          //blocks: ['column1', 'column2', 'column3', 'column3-7', 'text','video'],
          category: 'Basic Blocks',
          flexGrid: true,
        },
        'grapesjs-plugin-forms': {category: 'Additonal'},
        [strapiPluginRef]: {
          assetsManager: sharedAssetsManager,
        },
        'grapesjs-tabs': {
          tabsBlock: {
            category: 'Extra',
          },
        },
        'gjs-preset-webpage': {
          modalImportTitle: 'Import Template',
          modalImportLabel:
            '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
          modalImportContent: function (editor) {
            return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
          },
          filestackOpts: null, //{ key: 'AYmqZc2e8RLGLE7TGkX3Hz' },
          aviaryOpts: false,
          blocksBasicOpts: { flexGrid: 1 },
          customStyleManager: [
            {
              name: 'General',
              buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom'],
              properties: [
                {
                  name: 'Alignment',
                  property: 'float',
                  type: 'radio',
                  defaults: 'none',
                  list: [
                    { value: 'none', className: 'fa fa-times' },
                    { value: 'left', className: 'fa fa-align-left' },
                    { value: 'right', className: 'fa fa-align-right' },
                  ],
                },
                { property: 'position', type: 'select' },
              ],
            },
            {
              name: 'Dimension',
              open: false,
              buildProps: ['width', 'flex-width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
              properties: [
                {
                  id: 'flex-width',
                  type: 'integer',
                  name: 'Width',
                  units: ['px', '%'],
                  property: 'flex-basis',
                  toRequire: 1,
                },
                {
                  property: 'margin',
                  properties: [
                    { name: 'Top', property: 'margin-top' },
                    { name: 'Right', property: 'margin-right' },
                    { name: 'Bottom', property: 'margin-bottom' },
                    { name: 'Left', property: 'margin-left' },
                  ],
                },
                {
                  property: 'padding',
                  properties: [
                    { name: 'Top', property: 'padding-top' },
                    { name: 'Right', property: 'padding-right' },
                    { name: 'Bottom', property: 'padding-bottom' },
                    { name: 'Left', property: 'padding-left' },
                  ],
                },
              ],
            },
            {
              name: 'Typography',
              open: false,
              buildProps: [
                'font-family',
                'font-size',
                'font-weight',
                'letter-spacing',
                'color',
                'line-height',
                'text-align',
                'text-decoration',
                'text-shadow',
              ],
              properties: [
                { name: 'Font', property: 'font-family' },
                { name: 'Weight', property: 'font-weight' },
                { name: 'Font color', property: 'color' },
                {
                  property: 'text-align',
                  type: 'radio',
                  defaults: 'left',
                  list: [
                    { value: 'left', name: 'Left', className: 'fa fa-align-left' },
                    { value: 'center', name: 'Center', className: 'fa fa-align-center' },
                    { value: 'right', name: 'Right', className: 'fa fa-align-right' },
                    { value: 'justify', name: 'Justify', className: 'fa fa-align-justify' },
                  ],
                },
                {
                  property: 'text-decoration',
                  type: 'radio',
                  defaults: 'none',
                  list: [
                    { value: 'none', name: 'None', className: 'fa fa-times' },
                    { value: 'underline', name: 'underline', className: 'fa fa-underline' },
                    { value: 'line-through', name: 'Line-through', className: 'fa fa-strikethrough' },
                  ],
                },
                {
                  property: 'text-shadow',
                  properties: [
                    { name: 'X position', property: 'text-shadow-h' },
                    { name: 'Y position', property: 'text-shadow-v' },
                    { name: 'Blur', property: 'text-shadow-blur' },
                    { name: 'Color', property: 'text-shadow-color' },
                  ],
                },
              ],
            },
            {
              name: 'Decorations',
              open: false,
              buildProps: ['opacity', 'border-radius', 'border', 'box-shadow', 'background-bg'],
              properties: [
                {
                  type: 'slider',
                  property: 'opacity',
                  defaults: 1,
                  step: 0.01,
                  max: 1,
                  min: 0,
                },
                {
                  property: 'border-radius',
                  properties: [
                    { name: 'Top', property: 'border-top-left-radius' },
                    { name: 'Right', property: 'border-top-right-radius' },
                    { name: 'Bottom', property: 'border-bottom-left-radius' },
                    { name: 'Left', property: 'border-bottom-right-radius' },
                  ],
                },
                {
                  property: 'box-shadow',
                  properties: [
                    { name: 'X position', property: 'box-shadow-h' },
                    { name: 'Y position', property: 'box-shadow-v' },
                    { name: 'Blur', property: 'box-shadow-blur' },
                    { name: 'Spread', property: 'box-shadow-spread' },
                    { name: 'Color', property: 'box-shadow-color' },
                    { name: 'Shadow type', property: 'box-shadow-type' },
                  ],
                },
                {
                  id: 'background-bg',
                  property: 'background',
                  type: 'bg',
                },
              ],
            },
            {
              name: 'Extra',
              open: false,
              buildProps: ['transition', 'perspective', 'transform'],
              properties: [
                {
                  property: 'transition',
                  properties: [
                    { name: 'Property', property: 'transition-property' },
                    { name: 'Duration', property: 'transition-duration' },
                    { name: 'Easing', property: 'transition-timing-function' },
                  ],
                },
                {
                  property: 'transform',
                  properties: [
                    { name: 'Rotate X', property: 'transform-rotate-x' },
                    { name: 'Rotate Y', property: 'transform-rotate-y' },
                    { name: 'Rotate Z', property: 'transform-rotate-z' },
                    { name: 'Scale X', property: 'transform-scale-x' },
                    { name: 'Scale Y', property: 'transform-scale-y' },
                    { name: 'Scale Z', property: 'transform-scale-z' },
                  ],
                },
              ],
            },
            {
              name: 'Flex',
              open: false,
              properties: [
                {
                  name: 'Flex Container',
                  property: 'display',
                  type: 'select',
                  defaults: 'block',
                  list: [
                    { value: 'block', name: 'Disable' },
                    { value: 'flex', name: 'Enable' },
                  ],
                },
                {
                  name: 'Flex Parent',
                  property: 'label-parent-flex',
                  type: 'integer',
                },
                {
                  name: 'Direction',
                  property: 'flex-direction',
                  type: 'radio',
                  defaults: 'row',
                  list: [
                    {
                      value: 'row',
                      name: 'Row',
                      className: 'icons-flex icon-dir-row',
                      title: 'Row',
                    },
                    {
                      value: 'row-reverse',
                      name: 'Row reverse',
                      className: 'icons-flex icon-dir-row-rev',
                      title: 'Row reverse',
                    },
                    {
                      value: 'column',
                      name: 'Column',
                      title: 'Column',
                      className: 'icons-flex icon-dir-col',
                    },
                    {
                      value: 'column-reverse',
                      name: 'Column reverse',
                      title: 'Column reverse',
                      className: 'icons-flex icon-dir-col-rev',
                    },
                  ],
                },
                {
                  name: 'Justify',
                  property: 'justify-content',
                  type: 'radio',
                  defaults: 'flex-start',
                  list: [
                    {
                      value: 'flex-start',
                      className: 'icons-flex icon-just-start',
                      title: 'Start',
                    },
                    {
                      value: 'flex-end',
                      title: 'End',
                      className: 'icons-flex icon-just-end',
                    },
                    {
                      value: 'space-between',
                      title: 'Space between',
                      className: 'icons-flex icon-just-sp-bet',
                    },
                    {
                      value: 'space-around',
                      title: 'Space around',
                      className: 'icons-flex icon-just-sp-ar',
                    },
                    {
                      value: 'center',
                      title: 'Center',
                      className: 'icons-flex icon-just-sp-cent',
                    },
                  ],
                },
                {
                  name: 'Align',
                  property: 'align-items',
                  type: 'radio',
                  defaults: 'center',
                  list: [
                    {
                      value: 'flex-start',
                      title: 'Start',
                      className: 'icons-flex icon-al-start',
                    },
                    {
                      value: 'flex-end',
                      title: 'End',
                      className: 'icons-flex icon-al-end',
                    },
                    {
                      value: 'stretch',
                      title: 'Stretch',
                      className: 'icons-flex icon-al-str',
                    },
                    {
                      value: 'center',
                      title: 'Center',
                      className: 'icons-flex icon-al-center',
                    },
                  ],
                },
                {
                  name: 'Flex Children',
                  property: 'label-parent-flex',
                  type: 'integer',
                },
                {
                  name: 'Order',
                  property: 'order',
                  type: 'integer',
                  defaults: 0,
                  min: 0,
                },
                {
                  name: 'Flex',
                  property: 'flex',
                  type: 'composite',
                  properties: [
                    {
                      name: 'Grow',
                      property: 'flex-grow',
                      type: 'integer',
                      defaults: 0,
                      min: 0,
                    },
                    {
                      name: 'Shrink',
                      property: 'flex-shrink',
                      type: 'integer',
                      defaults: 0,
                      min: 0,
                    },
                    {
                      name: 'Basis',
                      property: 'flex-basis',
                      type: 'integer',
                      units: ['px', '%', ''],
                      unit: '',
                      defaults: 'auto',
                    },
                  ],
                },
                {
                  name: 'Align',
                  property: 'align-self',
                  type: 'radio',
                  defaults: 'auto',
                  list: [
                    {
                      value: 'auto',
                      name: 'Auto',
                    },
                    {
                      value: 'flex-start',
                      title: 'Start',
                      className: 'icons-flex icon-al-start',
                    },
                    {
                      value: 'flex-end',
                      title: 'End',
                      className: 'icons-flex icon-al-end',
                    },
                    {
                      value: 'stretch',
                      title: 'Stretch',
                      className: 'icons-flex icon-al-str',
                    },
                    {
                      value: 'center',
                      title: 'Center',
                      className: 'icons-flex icon-al-center',
                    },
                  ],
                },
              ],
            },
          ],
        }
      },
      canvas: {
        styles: [
          'https://unpkg.com/grapesjs-component-code-editor/dist/grapesjs-component-code-editor.min.css',
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
          'https://raw.githubusercontent.com/artf/grapesjs-preset-webpage/master/dist/grapesjs-preset-webpage.min.css',
          'https://unpkg.com/grapesjs/dist/css/grapes.min.css',
          //'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
        ],
        scripts: [
          'https://code.jquery.com/jquery-3.3.1.slim.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js',
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js'
        ],
      },
      wrapperIsBody: false,
      styleManager: styleManagerConfig,
      deviceManager: deviceManagerConfig,
      ...editorConfig,
    })

    const panelManager = editor.Panels;

    // panelManager.addButton('views',{
    //
    //   attributes: { title: 'Open Code' },
    //   className: 'fa fa-code',
    //   command: 'open-code',
    //   id: 'open-code'
    // });

    setEditor(editor);
    setMounted(true);
  }, [value, mounted, pluginsLoaded]);

  useEffect(() => {
    if (!mounted || editorConfigured) {
      return;
    }

    editor.setDevice('Desktop');
    editor.Panels.removeButton('options', 'export-template');

    editor.on('storage:store', function (e) {
      // When store is called, trigger strapi onChange callback

      onChange({
        target: {
          name,
          value: {
            components: JSON.parse(e.components),
            styles: JSON.parse(e.styles),
            css: e.css,
            html: e.html,
          },
        },
      });
      setEditorConfigured(true);
    });
  }, [mounted, editor, editorConfigured, sharedAssetsManager]);

  return (
    <form
      // DEV note:
      // When you're in an input of the editor and press enter,
      // Strapi model form is submitted.
      // This is not a definitive solution, just a patch to prevent
      // such behavior.
      //
      // It will result in a warning:
      // "Warning: validateDOMNesting(...): <form> cannot appear as a descendant of <form>."
      onSubmit={(evt) => {
        evt.stopPropagation();
        evt.preventDefault();
      }}
    >
      {MediaLibComponent && mediaLibConfiguration.selected && (
        <MediaLibComponent
          allowedTypes={['images']}
          isOpen={mediaLibConfiguration.open}
          multiple={false}
          noNavigation={false}
          selectedFiles={[mediaLibConfiguration.selected]}
          onClosed={onMediaLibClosed}
          onInputMediaChange={onMediaLibInputChange}
          onToggle={toggleMediaLib}
        />
      )}
      <div id="gjs" />
    </form>
  );
};

Editor.propTypes = {
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.object,
};

export default Editor;
