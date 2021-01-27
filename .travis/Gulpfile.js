const { series, src, dest } = require('gulp');
const babel = require('gulp-babel');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const merge = require ('merge-stream');

const dist = 'testable/';

const babelConfig = {
    'plugins': ['babel-plugin-transform-es2015-modules-commonjs']
};

const clear = function() {
    return src(dist, { read: false, allowEmpty: true })
        .pipe(clean());
};

const compile = function() {

    let core = src(['lib/**/*.js'], { base: './', })
        .pipe(sourcemaps.init())
        .pipe(babel(babelConfig))
        .pipe(sourcemaps.write())
        .pipe(dest(dist));

    return merge(core);
};

const default_task = series(clear, compile);


module.exports = { clear, compile, default: default_task };
