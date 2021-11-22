# ToxCalc!

## Description

ToxCalc! is a website purpose-built for toxicologists and other scientific professionals to help us do routine calculations. The goal of ToxCalc! is to help those of us who assess chemical hazards and risk work faster, with fewer errors, using the best available evidence. ToxCalc! is also designed to promote the principles of systematic review. It wants you to record and reference the calculations and default values you used and append them to your chemical safety reports so that everyone can see where the numbers came from. Finally, ToxCalc! is also designed to help you understand the math and biology behind the calculations through the use of tutorials and help features.

## What ToxCalc! Currently Does

Currently, ToxCalc! implements five multidirectional calculators (converts between doses and concentrations, animal and human doses, corrects for bioavailability, and calculates health-based exposure limits).

## Further Development

ToxCalc! is a framework designed to grow. It is designed to be a single place that houses all of the calculations/scores/risk assessment process maps that chemical safety assessors routinely use for the various subdomains of chemical safety assessment (e.g. environmental, pharmaceutical, occupational, consumer product). The ToxCalc! source code has been designed with the vision of growth in mind. It has reusable web UI components built on top of [https://angular.io/](Angular) and [https://ng-bootstrap.github.io/](Bootstrap).

## How to build

ToxCalc! uses [https://npmjs.com](NPM). Once you [have NPM installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) you can install the dependencies needed by ToxCalc! with:

```
npm install
```

### Run a dev server

To start up a copy of ToxCalc! on your own PC at http://localhost:4200/

```
npm run ng serve
```

### Build for production

To produce a production mode build of ToxCalc!, run

```
npm run ng build
```

which will create and fill the `dist/` directory. As a single page app, any 404 page should be redirected to the index.html in that directory.

## Citing ToxCalc! free web calculators

When citing calculators performed by ToxCalc!, include the name of the calculator or tool, the ToxCalc! URL of the specific calculator you used and the date that you used it.

Here's an example:

> Doses were calculated using the Total Dose Conversion Calculator on the ToxCalc! website: [insert hyperlink of the website you used] (accessed November 17, 2021).

In addition to the tool you used to perform the calculation, it is also important to explain your choices for defaults and equations and where they came from. For example, if you selected a default mouse bodyweight of 20 g for the calculation, explain why you selected it and where it came from.

## Citing tutorials or explanatory material in ToxCalc!

Include the name of the page, the date you accessed it, and the URL. 

Here’s an example:

> "How Do Changes in Body Weight, Intake Rate and Concentration Impact Dose" ToxCalc!, Accessed November 17, 2021.  [insert link to page here]

ToxCalc! is an open-source project developed by Safe Dose Ltd. Safe Dose is a Canadian for-profit corporation with a mission to use technology to improve the way we set limits for chemicals.

## Original Contributors

[Reena Sandhu](https://github.com/ReenaSandhu007) (reenasandhu@safedoseltd.com), toxicology.
[Nick Lewycky](https://github.com/nlewycky) and Ryan Young (ryan.young@ryerson.ca), programming.

## Published and Presenting

If you decide to publicly present or publish on ToxCalc! give me, Reena Sandhu, a heads-up (reenasandhu@safedoseltd.com). If I'm available, I might be able to provide feedback.

## License and Copyright

The ToxCalc! software is licensed under [GNU GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) by [Safe Dose Ltd](https://safedoseltd.com).©

The ToxCalc! logo is licensed under [CC BY-NC 4.0 ![Creative Commons License](https://i.creativecommons.org/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/) by Reena Sandhu.

“Size Matters” © 2018 is licensed under [CC BY-NC 4.0 ![Creative Commons License](https://i.creativecommons.org/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/) by Reena Sandhu.

“Tutorial: How do changes in body weight, intake rate and concentration impact dose?” © 2018 is licensed under [CC BY-NC 4.0 ![Creative Commons License](https://i.creativecommons.org/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/) by Reena Sandhu.
