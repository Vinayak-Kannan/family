import * as d3 from 'd3';
import React from "react";
import f3 from 'family-chart';  // npm install family-chart@0.2.1 or yarn add family-chart@0.2.1
import 'family-chart/styles/family-chart.css';

function create(data) {
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
        card_display: [d => `${d.data["label"]}`, d => d.data["desc"]],
        mini_tree: true,
        link_break: false
    })

    store.setOnUpdate(props => f3.view(store.getTree(), svg, Card, props || {}))
    store.updateMainId('Q43274')  // Charles III
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
        all_select_options.push({label: `${d.data["label"]}`, value: d["id"]})
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

export default class FamilyTree extends React.Component {
    cont = React.createRef();

    componentDidMount() {
        if (!this.cont.current) return;

        fetch('/Users/vinayakkannan/Desktop/family/family/src/family.json')
            .then(res => res.json())
            .then(data => create(data))
            .catch(err => console.error(err))
    }

    render() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return <div className="f3 f3-cont" id="FamilyChart" ref={this.cont}></div>;
    }
}
