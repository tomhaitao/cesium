define([
    './createTileMapServiceImageryProvider',
    './ComposerAssetType',
    './ComposerExternalImageryType',
    './Cesium3DTileset',
    '../Core/loadJson',
    '../Core/buildModuleUrl',
    '../Core/Check',
    '../Core/ComposerApi',
    '../Core/CesiumTerrainProvider',
    '../Core/RequestOptions',
    '../DataSources/CzmlDataSource',
    '../DataSources/Entity',
    '../DataSources/KmlDataSource'
], function(
    createTileMapServiceImageryProvider,
    ComposerAssetType,
    ComposerExternalImageryType,
    Cesium3DTileset,
    loadJson,
    buildModuleUrl,
    Check,
    ComposerApi,
    CesiumTerrainProvider,
    RequestOptions,
    CzmlDataSource,
    Entity,
    KmlDataSource) {
    'use strict';

    /**
     * Returns a promise to an cesium.com asset from the asset id
     * @param {Number} assetId The cesium.com asset id
     * @param {String} token The access token for the asset
     * @param {Object} [options] Additional options for the asset
     * @return {Promise<*>} A promise to the asset
     */
    function createComposerAsset(assetId, token, options) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('assetId', assetId);
        //>>includeEnd('debug');
        token = ComposerApi.getToken(token);
        return loadJson('//api.composer.dev:8081/api/assets/' + assetId + '/endpoint?access_token=' + token)
            .then(function(metadata) {
                var type = metadata.type;
                var assetToken = metadata.access_token;

                function getRequestOptions() {
                    return new RequestOptions({
                        retryAttempts: 1,
                        beforeRequest: function(url) {
                            return url + '?access_token=' + assetToken;
                        },
                        retryOnError: function() {
                            return loadJson('//api.composer.dev:8081/api/assets/' + assetId + '/endpoint?access_token=' + assetToken)
                                .then(function(metadata) {
                                    assetToken = metadata.access_token;
                                    return true;
                                })
                                .otherwise(function() {
                                    return false;
                                });
                        }
                    });
                }

                if (type === ComposerAssetType.MODEL) {
                    return new Entity({
                        name : metadata.name,
                        description : metadata.description,
                        position : options.position,
                        orientation : options.orientation,
                        model : {
                            uri : metadata.url,
                            show : options.show,
                            scale : options.scale,
                            minimumPixelSize : options.minimumPixelSize,
                            maximumScale : options.maximumScale,
                            incrementallyLoadTextures : options.incrementallyLoadTextures,
                            shadows : options.shadows,
                            runAnimations : options.runAnimations,
                            heightReference : options.heightReference,
                            distanceDisplayCondition : options.distanceDisplayCondition,
                            silhouetteColor : options.silhouetteColor,
                            silhouetteSize : options.silhouetteSize,
                            color : options.color,
                            colorBlendMode : options.colorBlendMode,
                            colorBlendAmount : options.colorBlendAmount
                        }
                    });
                } else if (type === ComposerAssetType['3DTILES']) {
                    if (metadata.isExternal) {
                        metadata = metadata.externalConfiguration;
                    }
                    metadata.requestOptions = getRequestOptions();
                    return new Cesium3DTileset(metadata);
                } else if (type === ComposerAssetType.CZML) {
                    return CzmlDataSource.load(metadata.url);
                } else if (type === ComposerAssetType.KML) {
                    return KmlDataSource.load(metadata.url, {
                        camera : options.scene.camera,
                        canvas : options.scene.canvas,
                        clampToGround : true
                    });
                } else if (type === ComposerAssetType.IMAGERY) {
                    if (!metadata.isExternal) {
                        return createTileMapServiceImageryProvider({
                            url : metadata.url,
                            requestOptions : getRequestOptions()
                        });
                    }
                    return ComposerExternalImageryType.getProvider(metadata.externalConfiguration);
                } else if (type === ComposerAssetType.TERRAIN || type === 'STK_TERRAIN_SERVER') {
                    return new CesiumTerrainProvider({
                        url : metadata.isExternal ? metadata.externalConfiguration.url : metadata.url,
                        requestWaterMask : true,
                        requestVertexNormals : true,
                        requestOptions: getRequestOptions()
                    });
                }
            });
    }

    return createComposerAsset;
});
