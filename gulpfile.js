const { src, dest, watch, series, parallel } = require('gulp');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();
const del = require('del');

const postcss = require('gulp-postcss');
const purgecss = require('gulp-purgecss');
const tailwindcss = require('tailwindcss');
const tailwindcssConfig = require('./tailwind.config');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('autoprefixer');

const babel = require('gulp-babel');

const imagemin = require('gulp-imagemin');

//Clean dist folder

const clean = () => {
  return del(['dist']);
};

//Compile pug files and move to dist
const views = () => {
  return src('./src/views/**/index.pug')
    .pipe(plumber())
    .pipe(
      pug({
        pretty: true,
        cache: true
      })
    )
    .pipe(dest('./dist'));
};

// Compile scss files, apply autoprefixer and move to dist
const styles = () => {
  return src(['./src/styles/*.css', './src/views/**/*.scss'])
    .pipe(plumber())
    .pipe(postcss([tailwindcss(tailwindcssConfig), autoprefixer()]))
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('./dist/styles'));
};

// Apply babel, merge js and move to dist
const vendorScripts = () => {
  return src('./src/scripts/vendors/**/*.js')
    .pipe(plumber())
    .pipe(dest('./dist/scripts/vendors'));
};

const websiteScripts = () => {
  return src(['./src/scripts/main.js', './src/views/**/*.js'])
    .pipe(plumber())
    .pipe(
      babel({
        presets: ['@babel/env']
      })
    )
    .pipe(dest('./dist/scripts'));
};

const scripts = parallel(vendorScripts, websiteScripts);

// Optimize images and move to dist

const images = () => {
  return src('./src/images/**/*')
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(dest('./dist/images'));
};

//Build and live preview

const build = series(clean, parallel(views, styles, scripts, images));

const livePreview = (done) => {
  browserSync.init(
    {
      server: {
        baseDir: './dist'
      }
    },
    done
  );
};

const watchAll = (done) => {
  watch('./src/views/**/*.pug', series(views, styles));
  watch(['./src/styles/main.css', './src/views/**/*.scss'], styles);
  watch(['./src/scripts/main.js', './src/views/**/*.js'], websiteScripts);
  watch('./src/images/**/*', images);
  watch('./dist/**/*').on('change', browserSync.reload);
  done();
};

exports.dev = series(build, livePreview, watchAll);
