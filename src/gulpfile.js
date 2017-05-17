'use strict';

var gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    concatCss   = require('gulp-concat-css'),
    csso        = require('gulp-csso'),
    concat      = require('gulp-concat'),
    minifyjs    = require('gulp-minify'),
    processhtml = require('gulp-processhtml');

gulp.task('sass', function () {
    return gulp.src('./sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./css'));
});

gulp.task('css_min_concat', function () {
    return gulp.src([
            './css/**/*.css'
        ])
        .pipe(csso())
        .pipe(concatCss('style.css'))
        .pipe(gulp.dest('../public/css'));
});

gulp.task('js_min_concat', function () {
    return gulp.src([
            './js/**/*.js'
        ])
        .pipe(minifyjs({
            ext:{min: '.min.js'},
            noSource: true
        }))
        .pipe(concat('script.js'))
        .pipe(gulp.dest('../public/js'));
});

gulp.task('posthtml', function () {
    return gulp.src('./*.html')
        .pipe(processhtml())
        .pipe(gulp.dest('../views'));
});

gulp.task('prod', ['sass', 'css_min_concat', 'js_min_concat', 'posthtml'], function() {});