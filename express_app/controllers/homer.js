const ethCrypto = require('eth-crypto');
const fs = require("fs");
const HDwalletprovider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const session = require("express-session");
const CurrentRide = require("../models/Auction");
const abi = require("../user_contract").abi2;
const address = require("../user_contract").address2;


module.exports = (app) => {
    app.get("/homer", async (req, res) => {

        if (req.session.username !== undefined) {
            if (req.session.userType === "Rider") {
                const dbRecord = await CurrentRide.findOne({ username: req.session.username });
                if (dbRecord === null) {
                    res.render("homer");
                }
                else {
                    res.redirect("/currentbids");
                }
            }
            else {
                res.render("homed");
            }
        } else {
            res.redirect("/");
        }


    });

    app.post("/homer", async (req, res) => {
        if (req.session.username) {

            const from = req.body.from;
            const to = req.body.to;

            const currentRide = new CurrentRide({
                from: from,
                to: to,
                username: req.session.username,
                status: "AVL",
                bids: []
            });
            currentRide.save((err) => {
                if (err)
                    console.log(err);
            });

            req.session.On = true;
            res.redirect("/currentbids");


        }

    });

    app.get("/currentbids", async (req, res) => {
        if (req.session.username) {
            const dbRecord = await CurrentRide.findOne({ username: req.session.username });
            console.log(dbRecord);

            if (dbRecord.status === "BOK" || dbRecord.status === "MET") {
                res.redirect("/finalr");
            } else {
                let message = null;
                const bids = dbRecord.bids;
                if (bids.length === 0) {
                    // console.log(bids);
                    message = "No bids yet";
                }
                res.render("bid", { to: dbRecord.to, from: dbRecord.from, bid: bids, message: message });
            }
        } else {
            res.redirect("/");
        }
    });

    app.post("/currentbids", async (req, res) => {
        if (req.session.username) {
            const bidder = req.body.bidder;
            const value = req.body.value;
            const resp = await CurrentRide.findOneAndUpdate({ username: req.session.username }, { finalBidder: bidder, finalValue: value, status: "BOK", $set: { bids: [] } });
            console.log(resp);

            res.redirect("/finalr");
        }
    });

    app.get("/finalr", async (req, res) => {
        if (req.session.username !== undefined) {
            const getBidder = await CurrentRide.find({ username: req.session.username });
            const provider = new HDwalletprovider(
                "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
                'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
            );
            const web3 = new Web3(provider);

            console.log("provider set");

            const contract = new web3.eth.Contract(abi, address);

            console.log(getBidder[0].from);
            console.log(getBidder[0].Coordinates);
            var res1 = getBidder[0].Coordinates.split(" ");
            const lat2 = res1[0];
            const lon2 = res1[1];

            var request = require("request");

            var options = {
                method: 'GET',
                url: 'https://forward-reverse-geocoding.p.rapidapi.com/v1/search',
                qs: {
                    bounded: '0',
                    limit: '5',
                    addressdetails: '1',
                    polygon_kml: '0',
                    polygon_threshold: '0.0',
                    polygon_svg: '0',
                    polygon_text: '0',
                    namedetails: '0',
                    'accept-language': 'en',
                    polygon_geojson: '0',
                    format: 'json',
                    q: getBidder[0].from
                },
                headers: {
                    'x-rapidapi-host': 'forward-reverse-geocoding.p.rapidapi.com',
                    'x-rapidapi-key': 'b369160fd9msh74ab3c368e0f68cp14a3ebjsn7d2c520c5aa2',
                    useQueryString: true
                }
            };


            request(options, async function (error, response, body) {
                if (error) throw new Error(error);

                var obj = JSON.parse(body);
                console.log(obj[0].lat, obj[0].lon);

                var lat1 = obj[0].lat;
                var lon1 = obj[0].lon;


                function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                    var R = 6371; // Radius of the earth in km
                    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
                    var dLon = deg2rad(lon2 - lon1);
                    var a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2)
                        ;
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    var d = R * c; // Distance in km
                    return d;
                }

                function deg2rad(deg) {
                    return deg * (Math.PI / 180)
                }

                var dist = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
                var t = (dist * 60) / 48;

                console.log(dist, "Distance");

                var time;
                if (t >= 60) {
                    var r = t % 60;
                    t = t / 60;
                    if (t == 0)
                        time = Math.floor(t) + " h";
                    else
                        time = Math.floor(t) + " h " + Math.floor(r) + " m";
                }
                else {
                    time = Math.floor(t) + " m";
                }

                const resp = await contract.methods.get(getBidder[0].finalBidder).call();
                console.log(resp);


                const final = {
                    name: resp['5'],
                    msg : "Driver will arrive in",
                    ridestatus : "Your ride has been confirmed! 🎉",
                    phoneNumber: resp['1'],
                    value: getBidder[0].finalValue,
                    vehicle: resp['2'],
                    vehicleNo: resp['3'],
                    time: time
                }
                const status = getBidder[0].status;
                if (status === "MET") {

                    var request = require("request");

                    var options1 = {
                        method: 'GET',
                        url: 'https://forward-reverse-geocoding.p.rapidapi.com/v1/search',
                        qs: {
                            bounded: '0',
                            limit: '5',
                            addressdetails: '1',
                            polygon_kml: '0',
                            polygon_threshold: '0.0',
                            polygon_svg: '0',
                            polygon_text: '0',
                            namedetails: '0',
                            'accept-language': 'en',
                            polygon_geojson: '0',
                            format: 'json',
                            q: getBidder[0].to
                        },
                        headers: {
                            'x-rapidapi-host': 'forward-reverse-geocoding.p.rapidapi.com',
                            'x-rapidapi-key': 'b369160fd9msh74ab3c368e0f68cp14a3ebjsn7d2c520c5aa2',
                            useQueryString: true
                        }
                    };
        
                    request(options1, async function (error, response, body) {
                        if (error) throw new Error(error);
        
                        var obj1 = JSON.parse(body);
                        console.log(obj1[0].lat, obj1[0].lon);
        
                        var lat3 = obj1[0].lat;
                        var lon3 = obj1[0].lon;
        
                        var dist = getDistanceFromLatLonInKm(lat1, lon1, lat3, lon3);
                        var t1 = (dist * 60) / 48;
                        console.log(dist, "Distance");
        
                        var time;
                        if (t1 >= 60) {
                            var r = t % 60;
                            t1 = t1 / 60;
                            if (t1 == 0)
                                time = Math.floor(t1) + " h";
                            else
                                time = Math.floor(t1) + " h " + Math.floor(r) + " m";
                        }
                        else {
                            time = Math.floor(t1) + " m";
                        }
        
        
                        const resp = await contract.methods.get(getBidder[0].finalBidder).call();
                        console.log(resp);
        
                        console.log(getBidder[0]);
                        const final1 = {
                            name: resp['5'],
                            msg : "You will reach your destination in",
                            ridestatus : "Your ride has started ! 🎉",
                            phoneNumber: resp['1'],
                            value: getBidder[0].finalValue,
                            vehicle: resp['2'],
                            vehicleNo: resp['3'],
                            time: time
                        }
        
        
                        res.render("finalr", { final: final1, message: "done" })
                    });
                } else {
                    res.render("finalr", { final: final, message: null });
                }
            });
        }
        else {
            res.redirect("/");
        }
    });
    app.post("/finalr", async (req, res) => {
        const currentUser = await CurrentRide.findOneAndUpdate({ username: req.session.username }, { status: "MET" });
        const getBidder = await CurrentRide.find({ username: req.session.username });
        const provider = new HDwalletprovider(
            "41362a4b6f3905e8b9a653620cdb4adbfad0e47b1061aa03d17d6208300eef9f",
            'https://ropsten.infura.io/v3/686f18f4f3144751bd5828b7155d0c55'
        );
        const web3 = new Web3(provider);

        console.log("provider set");

        const contract = new web3.eth.Contract(abi, address);

        console.log(getBidder[0].from);
        console.log(getBidder[0].to);

        var request = require("request");

        var options = {
            method: 'GET',
            url: 'https://forward-reverse-geocoding.p.rapidapi.com/v1/search',
            qs: {
                bounded: '0',
                limit: '5',
                addressdetails: '1',
                polygon_kml: '0',
                polygon_threshold: '0.0',
                polygon_svg: '0',
                polygon_text: '0',
                namedetails: '0',
                'accept-language': 'en',
                polygon_geojson: '0',
                format: 'json',
                q: getBidder[0].from
            },
            headers: {
                'x-rapidapi-host': 'forward-reverse-geocoding.p.rapidapi.com',
                'x-rapidapi-key': 'b369160fd9msh74ab3c368e0f68cp14a3ebjsn7d2c520c5aa2',
                useQueryString: true
            }
        };

        request(options, async function (error, response, body) {
            if (error) throw new Error(error);

            var obj = JSON.parse(body);
            console.log(obj[0].lat, obj[0].lon);

            var lat1 = obj[0].lat;
            var lon1 = obj[0].lon;

            var request = require("request");

            var options1 = {
                method: 'GET',
                url: 'https://forward-reverse-geocoding.p.rapidapi.com/v1/search',
                qs: {
                    bounded: '0',
                    limit: '5',
                    addressdetails: '1',
                    polygon_kml: '0',
                    polygon_threshold: '0.0',
                    polygon_svg: '0',
                    polygon_text: '0',
                    namedetails: '0',
                    'accept-language': 'en',
                    polygon_geojson: '0',
                    format: 'json',
                    q: getBidder[0].to
                },
                headers: {
                    'x-rapidapi-host': 'forward-reverse-geocoding.p.rapidapi.com',
                    'x-rapidapi-key': 'b369160fd9msh74ab3c368e0f68cp14a3ebjsn7d2c520c5aa2',
                    useQueryString: true
                }
            };

            request(options1, async function (error, response, body) {
                if (error) throw new Error(error);

                var obj1 = JSON.parse(body);
                console.log(obj1[0].lat, obj1[0].lon);

                var lat2 = obj1[0].lat;
                var lon2 = obj1[0].lon;

                function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                    var R = 6371; // Radius of the earth in km
                    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
                    var dLon = deg2rad(lon2 - lon1);
                    var a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2)
                        ;
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    var d = R * c; // Distance in km
                    return d;
                }

                function deg2rad(deg) {
                    return deg * (Math.PI / 180)
                }

                var dist = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
                var t = (dist * 60) / 48;
                console.log(dist, "Distance");

                var time;
                if (t >= 60) {
                    var r = t % 60;
                    t = t / 60;
                    if (t == 0)
                        time = Math.floor(t) + " h";
                    else
                        time = Math.floor(t) + " h " + Math.floor(r) + " m";
                }
                else {
                    time = Math.floor(t) + " m";
                }


                const resp = await contract.methods.get(getBidder[0].finalBidder).call();
                console.log(resp);

                console.log(getBidder[0]);
                const final = {
                    name: resp['5'],
                    phoneNumber: resp['1'],
                    msg : "You will reach your destination in",
                    ridestatus : "Your ride has started ! 🎉",
                    value: getBidder[0].finalValue,
                    vehicle: resp['2'],
                    vehicleNo: resp['3'],
                    time: time
                }


                res.render("finalr", { final: final, message: "done" })
            });

        });
    });

}