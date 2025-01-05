import * as d3 from 'd3';
import React from "react";
import f3 from 'family-chart';  // npm install family-chart@0.2.1 or yarn add family-chart@0.2.1
import 'family-chart/styles/family-chart.css';

function createRelsToAdd(data) {
    const to_add_spouses = [];
    for (let i = 0; i < data.length; i++) {
        const d = data[i];
        if (d.rels.children && d.rels.children.length > 0) {
            if (!d.rels.spouses) d.rels.spouses = [];
            const is_father = d.data.gender === "M";
            let spouse;

            d.rels.children.forEach(d0 => {
                const child = data.find(d1 => d1.id === d0);
                if (child == undefined) {
                    console.log(d0)
                }

                if (child.rels[is_father ? 'father' : 'mother'] !== d.id) return
                if (child.rels[!is_father ? 'father' : 'mother']) return
                if (!spouse) {
                    spouse = createToAddSpouse(d);
                    d.rels.spouses.push(spouse.id);
                }
                spouse.rels.children.push(child.id);
                child.rels[!is_father ? 'father' : 'mother'] = spouse.id;
            });
        }
    }
    to_add_spouses.forEach(d => data.push(d));
    return data

    function generateUUID() {
        let d = new Date().getTime();
        let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16;
            if(d > 0){//Use timestamp until depleted
                r = (d + r)%16 | 0;
                d = Math.floor(d/16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r)%16 | 0;
                d2 = Math.floor(d2/16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function createNewPerson({data, rels}) {
        return {id: generateUUID(), data: data || {}, rels: rels || {}, to_add: undefined
        }
    }

    function createToAddSpouse(d) {
        const spouse = createNewPerson({
            data: {gender: d.data.gender === "M" ? "F" : "M"},
            rels: {spouses: [d.id], children: []}
        });
        spouse.to_add = true;
        to_add_spouses.push(spouse);
        return spouse
    }
}


function create(oldData) {
    // Error checking
    const data = []
    oldData.forEach(d => {
        if (d != undefined && d.rels) {
            data.push(d)
        }
    })

    createRelsToAdd(data)

    const cont = document.querySelector("div#FamilyChart")  // make sure to create div with id FamilyChart
    const store = f3.createStore({
        data,
        node_separation: 250,
        level_separation: 150
    })
    const svg = f3.createSvg(cont)
    const Card = f3.elements.Card({
        store,
        svg,
        card_dim: {w:220,h:70,text_x:75,text_y:15,img_w:60,img_h:60,img_x:5,img_y:5},
        card_display: [d => `${d.data["fn"]}`, d => d.data["ln"]],
        mini_tree: true,
        link_break: false
    })

    store.setOnUpdate(props => f3.view(store.getTree(), svg, Card, props || {}))
    store.updateMainId('0')  // Kannan Sethuraman
    store.updateTree({initial: true})

    // with person_id this function will update the tree
    function updateTreeWithNewMainPerson(person_id, animation_initial = true) {
        store.updateMainId(person_id)
        store.updateTree({initial: animation_initial})
    }

    // random person

    d3.select(document.querySelector("#FamilyChart"))
        .append("button")
        .text("Random Person")
        .attr("style", "position: absolute; top: 10px; right: 10px; z-index: 1000;")
        .on("click", () => {
            const random_person = data[Math.floor(Math.random() * data.length)]
            const person_id = random_person["id"]
            updateTreeWithNewMainPerson(person_id, false)
        })


    // setup search dropdown
    // this is basic showcase, please use some autocomplete component and style it as you want

    const all_select_options = []
    data.forEach(d => {
        if (all_select_options.find(d0 => d0.value === d["id"])) return
        if (d.data && d.data["fn"] && d.data["ln"]) {
            all_select_options.push({label: `${d.data["fn"] + " " + d.data["ln"]}`, value: d["id"]})
        }
    })
    const search_cont = d3.select(document.querySelector("#FamilyChart")).append("div")
        .attr("style", "position: absolute; top: 10px; left: 10px; width: 150px; z-index: 1000;")
        .on("focusout", () => {
            setTimeout(() => {
                if (!search_cont.node().contains(document.activeElement)) {
                    updateDropdown([]);
                }
            }, 200);
        })
    const search_input = search_cont.append("input")
        .attr("style", "width: 100%;")
        .attr("type", "text")
        .attr("placeholder", "Search")
        .on("focus", activateDropdown)
        .on("input", activateDropdown)

    const dropdown = search_cont.append("div").attr("style", "overflow-y: auto; max-height: 300px; background-color: #000;")
        .attr("tabindex", "0")
        .on("wheel", (e) => {
            e.stopPropagation()
        })

    function activateDropdown() {
        const search_input_value = search_input.property("value")
        const filtered_options = all_select_options.filter(d => d.label.toLowerCase().includes(search_input_value.toLowerCase()))
        updateDropdown(filtered_options)
    }

    function updateDropdown(filtered_options) {
        dropdown.selectAll("div").data(filtered_options).join("div")
            .attr("style", "padding: 5px;cursor: pointer;border-bottom: .5px solid currentColor;")
            .on("click", (_, d) => {
                updateTreeWithNewMainPerson(d.value, true)
            })
            .text(d => d.label)
    }
}

fetch('src/family.json')
    .then(res => res.json())
    .then(data => create(data))
    .catch(err => console.error(err))

export default class FamilyTree extends React.Component {
    cont = React.createRef();

    componentDidMount() {
        if (!this.cont.current) return;
    }

    render() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return <div ref={this.cont} style={{
            margin: "5vw",
            width: "90vw",
            height: "90vh"
        }} className="f3 f3-cont" id="FamilyChart"></div>;
    }
}
