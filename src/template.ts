'use strict';

/**
 * Commonly used commands
 */
export namespace Templates {
    /**
     * Template for loaders
     */
    export const LOADER_TEMPLATE = 
    `<html>
        <link href="https://fonts.googleapis.com/css?family=Exo+2:100,400" rel="stylesheet"> 
        <style>
        html, body {
            width: 100%;
            height: 100%;
            font-size: 16px;
        }

        body {
            background: #1e1e1e;
        }

        #caption {
            font-family: 'Exo 2', sans-serif;
            font-weight: 100;
        }

        #tip > #text {
            color: #666
        }

        .blob {
            width: 2rem;
            height: 2rem;
            background: rgba(230, 230, 230, 0.85);
            border-radius: 50%;
            position: absolute;
            left: calc(50% - 1rem);
            top: calc(42% - 1rem);
            box-shadow: 0 0 1rem rgba(255, 255, 255, 0.35);
        }

        .blob-2 {
            -webkit-animation: animate-to-2 3.5s infinite;
            animation: animate-to-2 3.5s infinite;
        }

        .blob-3 {
            -webkit-animation: animate-to-3 3.5s infinite;
            animation: animate-to-3 3.5s infinite;
        }

        .blob-1 {
            -webkit-animation: animate-to-1 3.5s infinite;
            animation: animate-to-1 3.5s infinite;
        }

        .blob-4 {
            -webkit-animation: animate-to-4 3.5s infinite;
            animation: animate-to-4 3.5s infinite;
        }

        .blob-0 {
            -webkit-animation: animate-to-0 3.5s infinite;
            animation: animate-to-0 3.5s infinite;
        }

        .blob-5 {
            -webkit-animation: animate-to-5 3.5s infinite;
            animation: animate-to-5 3.5s infinite;
        }

        @-webkit-keyframes animate-to-2 {
            25%, 75% {
                -webkit-transform: translateX(-1.5rem) scale(0.75);
                transform: translateX(-1.5rem) scale(0.75);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                transform: translateX(0rem) scale(1);
            }
        }

        @keyframes animate-to-2 {
            25%, 75% {
                -webkit-transform: translateX(-1.5rem) scale(0.75);
                transform: translateX(-1.5rem) scale(0.75);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                transform: translateX(0rem) scale(1);
            }
        }

        @-webkit-keyframes animate-to-3 {
            25%, 75% {
                -webkit-transform: translateX(1.5rem) scale(0.75);
                transform: translateX(1.5rem) scale(0.75);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                transform: translateX(0rem) scale(1);
            }
        }

        @keyframes animate-to-3 {
            25%, 75% {
                -webkit-transform: translateX(1.5rem) scale(0.75);
                transform: translateX(1.5rem) scale(0.75);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                transform: translateX(0rem) scale(1);
            }
        }

        @-webkit-keyframes animate-to-1 {
            25% {
                -webkit-transform: translateX(-1.5rem) scale(0.75);
                transform: translateX(-1.5rem) scale(0.75);
            }
            50%, 75% {
                -webkit-transform: translateX(-4.5rem) scale(0.6);
                transform: translateX(-4.5rem) scale(0.6);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                transform: translateX(0rem) scale(1);
            }
        }

        @keyframes animate-to-1 {
            25% {
                -webkit-transform: translateX(-1.5rem) scale(0.75);
                transform: translateX(-1.5rem) scale(0.75);
            }
            50%, 75% {
                -webkit-transform: translateX(-4.5rem) scale(0.6);
                transform: translateX(-4.5rem) scale(0.6);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                transform: translateX(0rem) scale(1);
            }
        }

        @-webkit-keyframes animate-to-4 {
            25% {
                -webkit-transform: translateX(1.5rem) scale(0.75);
                transform: translateX(1.5rem) scale(0.75);
            }
            50%, 75% {
                -webkit-transform: translateX(4.5rem) scale(0.6);
                transform: translateX(4.5rem) scale(0.6);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                transform: translateX(0rem) scale(1);
            }
        }
        @keyframes animate-to-4 {
            25% {
                -webkit-transform: translateX(1.5rem) scale(0.75);
                        transform: translateX(1.5rem) scale(0.75);
            }
            50%, 75% {
                -webkit-transform: translateX(4.5rem) scale(0.6);
                        transform: translateX(4.5rem) scale(0.6);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                        transform: translateX(0rem) scale(1);
            }
        }
        @-webkit-keyframes animate-to-0 {
            25% {
                -webkit-transform: translateX(-1.5rem) scale(0.75);
                        transform: translateX(-1.5rem) scale(0.75);
            }
            50% {
                -webkit-transform: translateX(-4.5rem) scale(0.6);
                        transform: translateX(-4.5rem) scale(0.6);
            }
            75% {
                -webkit-transform: translateX(-7.5rem) scale(0.5);
                        transform: translateX(-7.5rem) scale(0.5);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                        transform: translateX(0rem) scale(1);
            }
        }
        @keyframes animate-to-0 {
            25% {
                -webkit-transform: translateX(-1.5rem) scale(0.75);
                        transform: translateX(-1.5rem) scale(0.75);
            }
            50% {
                -webkit-transform: translateX(-4.5rem) scale(0.6);
                        transform: translateX(-4.5rem) scale(0.6);
            }
            75% {
                -webkit-transform: translateX(-7.5rem) scale(0.5);
                        transform: translateX(-7.5rem) scale(0.5);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                        transform: translateX(0rem) scale(1);
            }
        }
        @-webkit-keyframes animate-to-5 {
            25% {
                -webkit-transform: translateX(1.5rem) scale(0.75);
                        transform: translateX(1.5rem) scale(0.75);
            }
            50% {
                -webkit-transform: translateX(4.5rem) scale(0.6);
                        transform: translateX(4.5rem) scale(0.6);
            }
            75% {
                -webkit-transform: translateX(7.5rem) scale(0.5);
                        transform: translateX(7.5rem) scale(0.5);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                        transform: translateX(0rem) scale(1);
            }
        }
        @keyframes animate-to-5 {
            25% {
                -webkit-transform: translateX(1.5rem) scale(0.75);
                        transform: translateX(1.5rem) scale(0.75);
            }
            50% {
                -webkit-transform: translateX(4.5rem) scale(0.6);
                        transform: translateX(4.5rem) scale(0.6);
            }
            75% {
                -webkit-transform: translateX(7.5rem) scale(0.5);
                        transform: translateX(7.5rem) scale(0.5);
            }
            95% {
                -webkit-transform: translateX(0rem) scale(1);
                        transform: translateX(0rem) scale(1);
            }
        }
        kbd {
            display: inline-block;
            margin: 0 .1em;
            padding: .1em .6em;
            font-family: Arial,"Helvetica Neue",Helvetica,sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #242729;
            text-shadow: 0 1px 0 #FFF;
            background-color: #e1e3e5;
            border: 1px solid #adb3b9;
            border-radius: 3px;
            box-shadow: 0 1px 0 rgba(12,13,14,0.2),0 0 0 2px #FFF inset;
            white-space: nowrap;
        }
        </style>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
    <body>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
            <defs>
                <filter id="gooey">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"></feGaussianBlur>
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"></feColorMatrix>
                <feBlend in="SourceGraphic" in2="goo"></feBlend>
                </filter>
            </defs>
        </svg>
        <div id="loading_screen">
        <div style="text-align: center" id="caption">
            <h1 style='color:rgba(100,100,100,0.2)'>fabric8-analytics</h1>
            <h1>Analysis In Progress</h1>
            <br />
            <br />
            <br />
        </div>
        <div>
            <div class="blob blob-0"></div>
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
            <div class="blob blob-3"></div>
            <div class="blob blob-4"></div>
            <div class="blob blob-5"></div>
        </div>
        <br />
        <div style="text-align: center" id="tip">
            TIP: <span id="text">TIP</span>
        </div>
        <script>
            var items = [
            "Don't forget to check out diagnostics result from our LSP server",
            'Click on items in Stack Report to discover more information'
            ];
            var x = 0;
            $(document).ready(function() {
                // rotate more tips here
                var tip_setter = function() {
                    $("#tip").fadeOut(500, function() {
                    $("#tip > #text").html(items[x]);
                    $("#tip").fadeIn(500);
                    x = (x+1) % items.length;
                    setTimeout(tip_setter, 10000);
                    });
                };
                
                tip_setter();
            }
            );
        </script>
        </div>
    </body>
    </html>`;

    export const HEADER_TEMPLATE = 
    `<!DOCTYPE html>
    <html>
    <head>
    <link href="https://fonts.googleapis.com/css?family=Exo+2:100,400" rel="stylesheet"> 
    <style>
    html,body {
    width: 100%;
    height: 100%;
    font-size: 16px;
    }

    body {
    background: #1e1e1e;
    }

    .caption {
    font-family: 'Exo 2', sans-serif;
    font-weight: 100;
    padding-left: 4px;
    }

    .top-caption {
    border-bottom: 1px solid #555;
    width: 95%;
    }

    .font {
        font-family: 'Exo 2', sans-serif;
    }

    .item {
    padding: 4px 0px;
    width: 95%;
    }

    .item-key {
    font-weight: 100;
    display: inline-block;
    width: 40%;
    padding-left: 4px;
    }

    .item-value {
    font-weight: 600;
    display: inline-block;
    width: 59%;
    }

    .item-value-2 {
    text-align: center;
    font-weight: 600;
    display: inline-block;
    width: 59%;
    }

    .item:nth-child(even) {background-color: rgba(255,255,255,0.05)}
    /*.item-value:nth-child(even) {background-color: rgba(255,255,255,0.05)}*/

    .grid {
    font-family: 'Exo 2', sans-serif;
    height: 70px;
    }

    .grid-left {
    width: 35%;
    font-weight: 600;
    line-height: 0.9em;
    padding: 1.5em;
    display: inline-block;
    float: left;
    background-color: rgba(255,0,0,0.075);
    }

    .grid-right {
    width: 35%;
    font-weight: 600;
    line-height: 0.9em;
    padding: 1.5em;
    display: inline-block;
    float: right;
    background-color: rgba(100,100,100,0.1);
    margin-right: 5%;
    }

    .rm {
    width: 95%;
    background-color: rgba(100, 100, 100, 0.1);
    font-family: 'Exo 2', sans-serif;
    cursor: pointer;
    }
    /*
    .rm:nth-child(even) {
    background-color: #fff;
    }*/
    .rm-even {
    background-color: rgba(100, 100, 100, 0.3);
    }

    .rm-origin {
    padding: 4px 0px;
    padding-left: 4px;
    display: inline-block;
    width: 30%;
    }
    .rm-name {
    width: 30%;
    padding: 4px 0px;
    display: inline-block;
    font-weight: bold;
    }
    .rm-score {
    float: right;
    padding: 4px 0px;
    padding-right: 4px;
    display: inline-block;
    }

    .high {
    font-weight: bold;
    color: #00aa00;
    }

    .medium {
    }

    .low {
    color: #aa2222;
    }

    .extra {
    width: 95%;
    background-color: rgba(0,100,0,0.1);
    }
    .extra-op {
    padding: 4px 0px;
    padding-left: 4px;
    display: inline-block;
    font-weight: 800;
    width: 5%;
    }
    .extra-name {
    padding: 4px 0px;
    padding-left: 4px;
    display: inline-block;
    }
    .extra:nth-child(odd) {background-color: rgba(0,150,0,0.1);}

    .missing {
    width: 95%;
    background-color: rgba(100,0,0,0.1);
    }
    .missing-op {
    padding: 4px 0px;
    padding-left: 4px;
    display: inline-block;
    font-weight: 800;
    width: 5%;
    }
    .missing-name {
    padding: 4px 0px;
    padding-left: 4px;
    display: inline-block;
    }
    .missing:nth-child(odd) {background-color: rgba(150,0,0,0.1);}

    .resolve {
    width: 91%;
    background-color: rgba(60, 200, 60, 0.3);
    font-family: 'Exo 2', sans-serif;
    cursor: pointer;
    text-align: center;
    font-size: 18px;
    padding: 2%;
    }
    </style>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
    </head>
    <body>
    <div class='top-caption'>
    <h1 class='caption'>Stack Analysis Report</h1>
    </div>`;

    export const FOOTER_TEMPLATE = '</body></html>';

}
