//getParameter
const getUrlParams = () => {
  let params = {};
  window.location.search.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    function (str, key, value) {
      params[key] = decodeURIComponent(value);
    }
  );
  return params;
};

function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  const result = Array.isArray(obj) ? [] : {};

  for (let key of Object.keys(obj)) {
    result[key] = deepClone(obj[key]);
  }
  return result;
}

const removeDuplicates = (array, key) => {
  return array.reduce((arr, item) => {
    const removed = arr.filter((i) => i[key] !== item[key]);
    return [...removed, item];
  }, []);
};

const shuffleRandom = (n) => {
  let ar = [];
  let temp;
  let rnum;

  //전달받은 매개변수 n만큼 배열 생성 ( 1~n )
  for (let i = 0; i <= n; i++) {
    ar.push(i);
  }

  //값을 서로 섞기
  for (let i = 0; i < ar.length; i++) {
    rnum = Math.floor(Math.random() * n); //난수발생
    temp = ar[i];
    ar[i] = ar[rnum];
    ar[rnum] = temp;
  }
  return ar;
};

const carrierImgSrc = (code) => {
  switch (code) {
    case "CDCT0202":
      return "/common/images/logo_carrier_docomo.svg";

    case "CDCT0203":
      return "/common/images/logo_carrier_au.svg";

    case "CDCT0204":
      return "/common/images/logo_carrier_soft-bank.svg";

    case "CDCT0219":
      return "/common/images/logo_carrier_uq-mobile.svg";

    case "CDCT0220":
      return "/common/images/logo_carrier_jcom.svg";

    case "CDCT0224":
      return "/common/images/logo_carrier_rakuten-mobile.svg";

    case "CDCT0226":
      return "/common/images/logo_carrier_sim-free.svg";
  }
};

const buying = function () {
  let $el,
    $buyingSticky,
    $buyingSelectWrap,
    $buyingViewWrap,
    $buyingOptionWrap,
    $buyingOptionList,
    $stickyBuyButton,
    $mySelectBuyButton,
    $compareButton,
    $dim,
    $loading,
    $layerWrap,
    urlParamsObj,
    buyingJsonDataArray = [],
    modelDataArray = [],
    productData,
    productResultArray = [],
    bannerDataArray = [],
    randomArray = [],
    bannerResultData = [],
    selectedFilter,
    modelCopyData,
    optionObj = {},
    selectObj = {},
    localCheck,
    bannerDataCheck = false,
    isOnpageshow = false,
    timer = 0;

  const init = () => {
    $el = $(".r2020-buying");
    $buyingSticky = $el.find(".r2020-sticky-menu.sticky-menu");
    $buyingSelectWrap = $el.find(".r2020-section-wrap.buying-select-wrap");
    $buyingViewWrap = $buyingSelectWrap.find(".buy-img-view-wrap");
    $buyingOptionWrap = $buyingSelectWrap.find(".buy-option-wrap");
    $buyingOptionList = $buyingOptionWrap.find(".option-select-list > li");
    $stickyBuyButton = $buyingSticky.find(".btn-buying");
    $mySelectBuyButton = $buyingOptionWrap.find(".btn-buying");
    $compareButton = $el.find(".btn-compare");
    $dim = $(".dim");
    $loading = $(".jp-loading");
    $layerWrap = $(".r2020-layer-360-wrap");

    urlParamsObj = getUrlParams();
    localCheck = !(
      location.href.indexOf("galaxymobile") > -1 ||
      location.href.indexOf("121.252.118.30") > -1
    );
    selectedFilter = [false, false];

    if (Object.keys(urlParamsObj).length === 0) history.back(); //params 이 없을 때
    if (!$el[0]) return;
    bindEvents();
  };

  const bindEvents = () => {
    let buyingTextArray = $buyingOptionWrap
      .find("[data-role-text]")
      .data("role-text")
      .split(",");
    if (
      urlParamsObj.iaCd === "CDCT0103" ||
      urlParamsObj.iaCd === "CDCT0104" ||
      urlParamsObj.iaCd === "CDCT0105"
    ) {
      $el.addClass("etc-select");
      $buyingOptionWrap.find("[data-role-text]").text(buyingTextArray[1]);
    } else {
      $buyingOptionWrap.find("[data-role-text]").text(buyingTextArray[0]);
    }

    loadProductData();
    useEvent.click();
    useEvent.onpageshow();
  };

  const buyingText = (code) => {
    let salesCode = code.toLowerCase();
    if (salesCode === "bscd0000") return "詳細を見る";
    if (salesCode === "bscd0010") return "ご購入はこちら";
    if (salesCode === "bscd0020") return "ご予約はこちら";
    if (salesCode === "bscd0030") return "予約 ・ 購入する";
  };

  //load hash data
  const loadProductData = () => {
    $loading.css("display", "block");
    $("html, body").addClass("not-scroll");

    //product family data 호출
    GALAXYJP.net.send(
      "productModelData",
      urlParamsObj,
      function (res, success) {
        if (success !== "success") return;

        if (res.status === 200) {
          const { response } = JSON.parse(res.responseText);
          modelDataArray = response.resultData.hasOwnProperty("modelList")
            ? response.resultData.modelList
            : [];
        }
      }
    );

    //패밀리 데이터 기준 배너 정보 호출
    GALAXYJP.ajax.api.productBanner.url = `${
      localCheck ? "https://www.galaxymobile.jp/" : ""
    }/api/banner/pd/${urlParamsObj.fmyId}`;
    GALAXYJP.net.send("productBanner", {}, function (res, success) {
      if (success !== "success") return;

      if (res.status === 200) {
        const { response } = JSON.parse(res.responseText);
        bannerDataArray = response.resultData.hasOwnProperty(
          "productBannerList"
        )
          ? response.resultData.productBannerList
          : [];
      }
    });

    const dataSetInterVal = setInterval(function () {
      timer = timer + 100;
      if (modelDataArray.length > 0 && bannerDataArray.length > 0) {
        clearInterval(dataSetInterVal);

        $loading.css("display", "none");
        $("html, body").removeClass("not-scroll");
        bannerDataCheck = true;

        optionFiltering();
      } else if (timer > 10000) {
        if (modelDataArray.length > 0 && bannerDataArray.length === 0) {
          clearInterval(dataSetInterVal);

          $("html, body").removeClass("not-scroll");
          $loading.css("display", "none");
          bannerDataCheck = false;
          $(".r2020-slide-wrap.pd-local-banner").remove();

          optionFiltering();
        } else if (
          modelDataArray.length === 0 &&
          bannerDataArray.length === 0
        ) {
          history.back();
        }
      }
    }, 100);
  };

  //data option filtering
  const optionFiltering = () => {
    modelCopyData = deepClone(modelDataArray);

    //product option name 옵션 정리
    modelCopyData = modelCopyData.filter(
      (modelObj) => modelObj.fmyId === urlParamsObj.fmyId
    );
    productData = modelCopyData[0].hasOwnProperty("relPrdList")
      ? modelCopyData[0].relPrdList
      : [];

    productData.forEach((productObj) => {
      if (typeof optionObj.model === "undefined") optionObj.model = [];
      selectObj.model = "";
      if (typeof optionObj.colors === "undefined") optionObj.colors = [];
      selectObj.colors = "";
      if (
        urlParamsObj.iaCd === "CDCT0101" ||
        urlParamsObj.iaCd === "CDCT0102"
      ) {
        if (typeof optionObj.carrier === "undefined") optionObj.carrier = [];
        selectObj.carrier = "";
      } else {
        if (typeof optionObj.shop === "undefined") optionObj.shop = [];
        selectObj.shop = "";
      }

      optionObj.model.push(productObj);

      if (productObj.hasOwnProperty("colors") && productObj.colors !== null) {
        productObj.colors.forEach((colorObj) => {
          optionObj.colors.push(colorObj);
        });
      }

      if (productObj.hasOwnProperty("carrier") && productObj.carrier !== null) {
        productObj.carrier.forEach((carrierObj) => {
          optionObj.carrier.push(carrierObj);
        });
      }

      if (productObj.hasOwnProperty("shop") && productObj.shop !== null) {
        productObj.shop.forEach((shopObj) => {
          optionObj.shop.push(shopObj);
        });
      }
    });

    if (typeof optionObj.model !== "undefined")
      optionObj.model = removeDuplicates(optionObj.model, "prdName");
    if (typeof optionObj.colors !== "undefined")
      optionObj.colors = removeDuplicates(optionObj.colors, "name");
    if (typeof optionObj.carrier !== "undefined")
      optionObj.carrier = removeDuplicates(optionObj.carrier, "code");
    if (typeof optionObj.shop !== "undefined")
      optionObj.shop = removeDuplicates(optionObj.shop, "code");

    optionGrid();
  };

  //data option gird
  const optionGrid = () => {
    let optionGridHTML = "",
      optionGridIdx = 0;

    for (let key in optionObj) {
      optionGridHTML = "";

      if (key === "model") {
        optionObj.model.forEach((modelObj, idx) => {
          optionGridHTML += '<li data-role-option="model">';
          optionGridHTML += `<input type="radio" name="buy-model" id="model_${
            idx + 1
          }_choose" data-role-code="${modelObj.prdName
            .toLowerCase()
            .replace(/\s/g, "-")}" data-role-id="${modelObj.id}">`;
          optionGridHTML += `<label for="model_${idx + 1}_choose">`;
          optionGridHTML += `<span><em>${modelObj.prdName}</em></span>`;
          optionGridHTML += `</label>`;
          optionGridHTML += `</li>`;
        });
      } else if (key === "colors") {
        optionObj.colors.forEach((colorObj, idx) => {
          optionGridHTML += '<li data-role-option="colors">';
          optionGridHTML += `<input type="radio" name="buy-colors" id="colors_${
            idx + 1
          }_choose" data-role-id="${colorObj.name}">`;
          optionGridHTML += `<label for="colors_${idx + 1}_choose">`;
          optionGridHTML += `<span class="select-color-code" style="background-color:${colorObj.hex}"></span>`;
          optionGridHTML += `<span>${colorObj.name}</span>`;
          optionGridHTML += `</label>`;
          optionGridHTML += `</li>`;
        });
      } else if (key === "carrier") {
        optionObj.carrier.forEach((carrierObj, idx) => {
          optionGridHTML += '<li data-role-option="carrier">';
          optionGridHTML += `<input type="radio" name="buy-carrier" id="carrier_${
            idx + 1
          }_choose" data-role-id="${carrierObj.code}">`;
          optionGridHTML += `<label for="carrier_${idx + 1}_choose">`;
          optionGridHTML += `<span><img src="${carrierImgSrc(
            carrierObj.code
          )}" alt="${carrierObj.name}"></span>`;
          optionGridHTML += `</label>`;
          optionGridHTML += `</li>`;
        });
        //if (optionObj.carrier.length === 0) optionGridIdx = optionGridIdx - 1;
      } else if (key === "shop") {
        optionObj.shop.forEach((shopObj, idx) => {
          optionGridHTML += '<li data-role-option="shop">';
          optionGridHTML += `<input type="radio" name="buy-shop" id="shop_${
            idx + 1
          }_choose" data-role-id="${shopObj.code}">`;
          optionGridHTML += `<label for="shop_${idx + 1}_choose">`;
          optionGridHTML += `<span><img src="${shopObj.thumbnail}" alt="${shopObj.alt}"></span>`;
          optionGridHTML += `</label>`;
          optionGridHTML += `</li>`;
        });
      }

      $buyingOptionList
        .eq(optionGridIdx)
        .find(".buy-product-option")
        .html(optionGridHTML);
      optionGridIdx = optionGridIdx + 1;
    }

    optionSelectFiltering("init");
  };

  //option select filter & checked
  const optionSelectFiltering = (type, id, option) => {
    if (type === "init") {
      selectObj.model = urlParamsObj.hasOwnProperty("id")
        ? Number(urlParamsObj.id)
        : false;
      selectObj.colors = urlParamsObj.hasOwnProperty("colors")
        ? urlParamsObj.colors
        : false;
      if (selectObj.hasOwnProperty("carrier"))
        selectObj.carrier = urlParamsObj.hasOwnProperty("carrier")
          ? urlParamsObj.carrier
          : false;
      if (selectObj.hasOwnProperty("shop"))
        selectObj.shop = urlParamsObj.hasOwnProperty("shop")
          ? urlParamsObj.shop
          : false;
    } else if (type === "click") {
      isOnpageshow = false;

      if (option === "model") {
        selectObj.colors = false;
        if (selectObj.hasOwnProperty("carrier")) selectObj.carrier = false;
        if (selectObj.hasOwnProperty("shop")) selectObj.shop = false;
      }
      selectObj[option] = id;
    }

    for (let key in selectObj) {
      if (key === "model" && selectObj.model !== false) {
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.model}"]`)
          .prop("checked", true);
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.model}"]`)
          .addClass("on");
      }

      if (key === "colors" && selectObj.colors !== false) {
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.colors}"]`)
          .prop("checked", true);
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.colors}"]`)
          .addClass("on");
      } else if (!selectObj.colors) {
        $buyingOptionWrap
          .find('[data-role-option="colors"] input[data-role-id]')
          .prop("checked", false);
      }

      if (key === "carrier" && selectObj.carrier !== false) {
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.carrier}"]`)
          .prop("checked", true);
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.carrier}"]`)
          .addClass("on");
      } else if (!selectObj.carrier) {
        $buyingOptionWrap
          .find('[data-role-option="carrier"] input[data-role-id]')
          .prop("checked", false);
      }

      if (key === "shop" && selectObj.shop !== false) {
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.shop}"]`)
          .prop("checked", true);
        $buyingOptionList
          .find(`input[data-role-id="${selectObj.shop}"]`)
          .addClass("on");
      } else if (!selectObj.shop) {
        $buyingOptionWrap
          .find('[data-role-option="shop"] input[data-role-id]')
          .prop("checked", false);
      }
    }

    //product filtering
    let productDataArray = [];
    productData.forEach((productObj) => {
      let productID = productObj.id;

      if (productID === Number(selectObj.model)) {
        return productDataArray.push(productObj);
      }
    });

    if (isOnpageshow === false) optionSelectParamChange();
    optionSelectDataGrid(productDataArray);
    optionSelectDisabled(productDataArray);

    productResultArray = productDataArray;
    if (option !== "colors" && bannerDataCheck) bannerEvent(productResultArray);
  };

  //option 선택에 따른 param change
  const optionSelectParamChange = () => {
    let selectParams = `/buy/?iaCd=${modelCopyData[0].iaCd}&fmyId=${modelCopyData[0].fmyId}&`;

    for (let key in selectObj) {
      if (selectObj[key]) {
        if (key === "model") selectParams += `id=${selectObj.model}&`;
        if (key === "colors") selectParams += `colors=${selectObj.colors}&`;
        if (key === "carrier") selectParams += `carrier=${selectObj.carrier}&`;
        if (key === "shop") selectParams += `shop=${selectObj.shop}&`;
      }
    }

    selectParams = selectParams.slice(0, -1);
    history.pushState(null, null, location.origin + selectParams);
  };

  //option 선택에 따른 data grid
  const optionSelectDataGrid = (productDataArray) => {
    let $stickySelectHeadingName = $buyingSticky.find(".heading span"),
      $stickySelectName = $buyingSticky.find(".my-product span"),
      $stickySelectColor = $buyingSticky.find(".my-color span"),
      $stickySelectCarrier = $buyingSticky.find(".my-store span"),
      $buyImgWrap = $buyingViewWrap.find(".product-img-wrap"),
      $buyCtaWrap = $buyingViewWrap.find(">.cta-area"),
      $mySelectOptionWrap = $buyingOptionWrap.find(".my-select-option"),
      $mySelectImg = $mySelectOptionWrap.find(".select-img-wrap"),
      $mySelectName = $mySelectOptionWrap.find(".product-name"),
      $mySelectColor = $mySelectOptionWrap.find(".product-color"),
      $mySelectCarrier = $mySelectOptionWrap.find(".product-store span"),
      selectDataObj = productDataArray[0];

    //reset
    $stickySelectHeadingName.text("");
    $stickySelectName.text("");
    $stickySelectColor.text("");
    $stickySelectCarrier.html("");
    $buyImgWrap.html("");
    $mySelectImg.html("");
    $mySelectName.text("");
    $mySelectColor.text("");
    $mySelectCarrier.html("");

    //sticky family title
    $stickySelectHeadingName.text(modelCopyData[0].fmyMktNm);

    //title
    if (selectObj.model) {
      $stickySelectName.text(selectDataObj.prdName);
      $mySelectName.text(selectDataObj.prdName);
    }

    //color
    if (selectObj.colors) {
      $stickySelectColor.text(selectObj.colors);
      $mySelectColor.text(selectObj.colors);
    }

    //carrier
    if (selectObj.carrier) {
      selectDataObj.carrier.forEach((carrierObj) => {
        if (carrierObj.code === selectObj.carrier) {
          $stickySelectCarrier.html(
            `<img src="${carrierImgSrc(selectObj.carrier)}" alt="${
              carrierObj.name
            }">`
          );
          $mySelectCarrier.html(
            `<img src="${carrierImgSrc(selectObj.carrier)}" alt="${
              carrierObj.name
            }">`
          );
        }
      });
    }

    //shop
    if (selectObj.shop) {
      selectDataObj.shop.forEach((shopObj) => {
        if (Number(shopObj.code) === Number(selectObj.shop)) {
          $stickySelectCarrier.html(
            `<img src="${shopObj.thumbnail}" alt="${shopObj.alt}">`
          );
          $mySelectCarrier.html(
            `<img src="${shopObj.thumbnail}" alt="${shopObj.alt}">`
          );
        }
      });
    }

    /**************************************
     * buying img wrap & option select 영역
     ***************************************/

    //model & colors 둘다 선택이 된 경우
    if (selectObj.model && selectObj.colors) {
      selectDataObj.colors.forEach((colorObj) => {
        if (colorObj.name === selectObj.colors) {
          $buyImgWrap.html(
            `<img src="${colorObj.thumbnail}" alt="${colorObj.alt}">`
          );
          $mySelectImg.html(
            `<img src="${colorObj.thumbnail}" alt="${colorObj.alt}">`
          );
        }
      });
      //model 만 선택이 된 경우
    } else if (selectObj.model && !selectObj.colors) {
      $buyImgWrap.html(
        `<img src="${selectDataObj.prdThumbnail}" alt="${selectDataObj.prdThumbAlt}">`
      );
      $mySelectImg.html(
        `<img src="${selectDataObj.prdThumbnail}" alt="${selectDataObj.prdThumbAlt}">`
      );
    }

    //buy button action
    if (
      selectObj.model &&
      selectObj.colors &&
      (selectObj.carrier || selectObj.shop)
    ) {
      buyingButtonEvent(selectDataObj, true);
    } else {
      buyingButtonEvent(selectDataObj, false);
    }

    //360 button
    if (
      selectDataObj.hasOwnProperty("contentUrl") &&
      selectDataObj.contentUrl.length > 0
    ) {
      $buyCtaWrap.find("a").eq(0).attr("href", selectDataObj.contentUrl);
      $buyCtaWrap
        .find("a")
        .eq(0)
        .attr(
          "data-omni-action",
          `prd^buy:buy-op:${selectDataObj.prdName}:thumb:popup-to:360^${selectObj.model}`
        );
      $buyCtaWrap.find("a").eq(0).removeAttr("style");
    } else {
      $buyCtaWrap.find("a").eq(0).css("display", "none");
    }

    //more button
    if (
      modelCopyData !== undefined &&
      modelCopyData[0].hasOwnProperty("pdpUrl")
    ) {
      let taggingUrl = modelCopyData[0].pdpUrl.split("/");
      taggingUrl = taggingUrl.filter((item) => item !== "");
      taggingUrl = taggingUrl[taggingUrl.length - 1];

      $buyCtaWrap.find("a").eq(1).attr("href", modelCopyData[0].pdpUrl);
      $buyCtaWrap
        .find("a")
        .eq(1)
        .attr(
          "data-omni-action",
          `prd^buy:buy-op:${selectDataObj.prdName}:page-to:${taggingUrl}`
        );
      $buyCtaWrap.find("a").eq(1).removeAttr("style");
    } else {
      $buyCtaWrap.find("a").eq(1).css("display", "none");
    }

    //compare link setting (smartphones)
    if (urlParamsObj.iaCd === "CDCT0101") {
      $compareButton.attr(
        "href",
        `/smartphones/compare/?product1=${productDataArray[0].prdName.replace(
          /\s/gi,
          "_"
        )}`
      );
      $compareButton.attr(
        "data-omni-action",
        `prd^buy:mkt-banner:banner:page-to:prd^sph^compare^${selectObj.model}`
      );
    }

    tagging.buying(selectDataObj);
  };

  //option 선택에 따른 buy 버튼 텍스트 변경 및 url 변경
  const buyingButtonEvent = (selectDataObj, success) => {
    let loadingImg = '<img src="/common/images/loading_bar.gif" alt="loading">';

    if (success) {
      $stickyBuyButton.addClass("disabled");
      $mySelectBuyButton.addClass("disabled");
      $stickyBuyButton.html(loadingImg);
      $mySelectBuyButton.find("span").html(loadingImg);

      const localCheck = !(
        location.href.indexOf("galaxymobile") > -1 ||
        location.href.indexOf("121.252.118.30") > -1
      );
      GALAXYJP.ajax.api.buying.url = `${
        localCheck ? "https://www.galaxymobile.jp" : ""
      }/api/buying-url/buy-${urlParamsObj.fmyId}-${selectObj.model}-${
        selectObj.carrier !== undefined ? selectObj.carrier : selectObj.shop
      }`;
      GALAXYJP.net.send("buying", {}, function (res, success) {
        if (success !== "success") return;

        if (res.status === 200) {
          const { response } = JSON.parse(res.responseText);
          buyingJsonDataArray =
            response.resultData.hasOwnProperty("buyingURLList") &&
            response.resultData.buyingURLList.length > 0
              ? response.resultData.buyingURLList[0].buyingURL
              : [];

          //buying url filter
          buyingJsonDataArray = buyingJsonDataArray.filter(
            (buyingObj) => buyingObj.color.name === selectObj.colors
          );

          if (buyingJsonDataArray.length > 0) {
            $stickyBuyButton.removeClass("disabled");
            $mySelectBuyButton.removeClass("disabled");
            $stickyBuyButton.html(buyingText(buyingJsonDataArray[0].salesType));
            if (buyingJsonDataArray[0].salesType.toLowerCase() === "bscd0030") {
              $stickyBuyButton.addClass("btn-booking-buying");
            } else {
              $stickyBuyButton.removeClass("btn-booking-buying");
            }
            $stickyBuyButton.attr("href", buyingJsonDataArray[0].buyingUrl);
            $mySelectBuyButton
              .find("span")
              .html(buyingText(buyingJsonDataArray[0].salesType));
            $mySelectBuyButton.attr("href", buyingJsonDataArray[0].buyingUrl);
          } else if (buyingJsonDataArray.length === 0) {
            $stickyBuyButton.html("データなし");
            $mySelectBuyButton.find("span").html("データなし");
          }
        }
      });
    } else {
      $stickyBuyButton.addClass("disabled");
      if (selectDataObj.salesType.toLowerCase() === "bscd0030") {
        $stickyBuyButton.addClass("btn-booking-buying");
      } else {
        $stickyBuyButton.removeClass("btn-booking-buying");
      }
      $mySelectBuyButton.addClass("disabled");
      $stickyBuyButton.html(buyingText(selectDataObj.salesType));
      $mySelectBuyButton.find("span").html(buyingText(selectDataObj.salesType));
    }
  };

  //option 선택에 따른 disabled
  const optionSelectDisabled = (productDataArray) => {
    $buyingOptionWrap
      .find('[data-role-option]:not([data-role-option="model"]) input')
      .attr("disabled", true);

    productDataArray[0].colors.forEach((colorsObj) => {
      let $colorsInput = $buyingOptionWrap.find(
        '[data-role-option="colors"] input'
      );
      $colorsInput.each(function () {
        let $this = $(this),
          isColorsName = $this.data("role-id").toLowerCase();

        if (colorsObj.name.toLowerCase().includes(isColorsName)) {
          $this.attr("disabled", false);
        }
      });
    });

    if (productDataArray[0].carrier !== null) {
      let $carrierInput = $buyingOptionWrap.find(
        '[data-role-option="carrier"] input'
      );
      productDataArray[0].carrier.forEach((carrierObj) => {
        $carrierInput.each(function () {
          let $this = $(this),
            isCarrierName = $this.data("role-id").toLowerCase();
          if (carrierObj.code.toLowerCase().includes(isCarrierName))
            $this.attr("disabled", false);
        });
      });
    }

    if (productDataArray[0].shop !== null) {
      let $shopInput = $buyingOptionWrap.find(
        '[data-role-option="shop"] input'
      );
      productDataArray[0].shop.forEach((shopObj) => {
        $shopInput.each(function () {
          let $this = $(this),
            isShopName = $this.data("role-id");
          if (shopObj.code.includes(isShopName)) $this.attr("disabled", false);
        });
      });
    }
  };

  //banner
  const bannerEvent = (resultArray) => {
    if (bannerResultData.length === 0) {
      let bannerFilterData = bannerDataArray.slice();
      bannerFilterData.forEach((bannerObj) => {
        let uuidArray = bannerObj.uuid.split("-");
        bannerObj.bannerList.forEach((obj) => {
          if (typeof obj.id === "undefined") obj.id = uuidArray[1];
          if (typeof obj.carrier === "undefined")
            obj.carrier = uuidArray[2].toUpperCase();
          if (typeof obj.ranSelect === "undefined") obj.ranSelect = false;
          bannerResultData.push(obj);
        });
      });

      bannerResultData = bannerResultData.filter((obj) => obj.display === "on");

      if (randomArray.length === 0) {
        randomArray = shuffleRandom(bannerResultData.length - 1);
        randomArray.forEach((randomIdx, n) => {
          if (n < 5) {
            bannerResultData[randomIdx].ranSelect = true;
          }
        });
      }

      window.GALAXYJP.banner.apiLoad("buy", bannerResultData, 0);
      setTimeout(function () {
        window.GALAXYJP.banner.slideFilter("buy", 0, selectedFilter);
      }, 500);

      if (
        urlParamsObj.iaCd === "CDCT0101" ||
        urlParamsObj.iaCd === "CDCT0102"
      ) {
        if (selectObj.carrier) bannerEvent(resultArray); //carrier 선택 시 함수 재 호출
      } else {
        if (selectObj.shop) bannerEvent(resultArray); //shop 선택 시 함수 재 호출
      }
    } else {
      if (
        urlParamsObj.iaCd === "CDCT0101" ||
        urlParamsObj.iaCd === "CDCT0102"
      ) {
        GALAXYJP.productDetail.activeCarrier =
          selectObj.carrier === false ? "" : selectObj.carrier;
      } else {
        let shopObj = resultArray[0].shop.filter(
          (obj) => Number(obj.code) === Number(selectObj.shop)
        );
        GALAXYJP.productDetail.activeCarrier = "shop";
        GALAXYJP.productDetail.shop.src =
          selectObj.shop === false ? "" : shopObj[0].thumbnail;
        GALAXYJP.productDetail.shop.alt =
          selectObj.shop === false ? "" : shopObj[0].alt;
      }

      if (
        urlParamsObj.iaCd === "CDCT0101" ||
        urlParamsObj.iaCd === "CDCT0102"
      ) {
        selectedFilter =
          selectObj.carrier === false
            ? [false, false]
            : [`${selectObj.model}`, `${selectObj.carrier}`];
      } else {
        selectedFilter =
          selectObj.shop === false
            ? [false, false]
            : [`${selectObj.model}`, `${selectObj.shop}`];
      }

      setTimeout(function () {
        window.GALAXYJP.banner.slideFilter("buy", 0, selectedFilter);
      }, 500);
    }
  };

  const tagging = {
    buying(selectDataObj) {
      let singleName = "^" + selectDataObj.prdName,
        colorName = selectObj.colors === false ? "" : "^" + selectObj.colors,
        carrierName = "",
        shopName = "",
        totalName = "";

      if (selectObj.hasOwnProperty("carrier") && selectObj.carrier !== null) {
        selectDataObj.carrier.forEach((obj) => {
          if (obj.code === selectObj.carrier)
            return (shopName = "^" + obj.name);
        });
      } else if (selectObj.hasOwnProperty("shop") && selectObj.shop !== null) {
        selectDataObj.shop.forEach((obj) => {
          if (Number(obj.code) === Number(selectObj.shop))
            return (shopName = "^" + obj.name);
        });
      }

      totalName = singleName + colorName + carrierName + shopName;
      $stickyBuyButton.attr(
        "data-omni-action",
        `prd^buy:navi:button:buy${totalName}`
      );
      $mySelectBuyButton.attr(
        "data-omni-action",
        `prd^buy:navi:button:buy${totalName}`
      );
    },
  };

  const useEvent = {
    click() {
      const $optionSelectInput = ".r2020-buying .buy-option-wrap input";
      $(document).on("click", $optionSelectInput, function () {
        let $this = $(this),
          isID = $this.data("role-id"),
          isOption = $this.parents("[data-role-option]").data("role-option");

        if ($this.is(".on") === false) {
          $this
            .addClass("on")
            .parent()
            .siblings()
            .find("input")
            .removeClass("on");
          if (isOption === "model") {
            $buyingOptionWrap
              .find(
                '[data-role-option="colors"] input, [data-role-option="carrier"] input'
              )
              .removeClass("on");
          }

          optionSelectFiltering("click", isID, isOption);
        } else {
          return false;
        }
      });

      $buyingViewWrap
        .find(".btn-popup-360")
        .off()
        .on("click", function (e) {
          e.preventDefault();

          $("html, body").addClass("not-scroll");
          $layerWrap.addClass("on");
          $layerWrap.attr("tabindex", 0);
          $layerWrap.focus();

          $layerWrap.find(".layer-tit").text(productData[0].prdName);
          $layerWrap.find(".iframe").attr("src", productData[0].contentUrl);
        });

      $layerWrap
        .find(".btn-layer-close")
        .off()
        .on("click", function () {
          $("html, body").removeClass("not-scroll");
          $layerWrap.removeClass("on");
          $layerWrap.removeAttr("tabindex");
        });

      $stickyBuyButton.off().on("click", function (e) {
        let $this = $(this);
        if ($this.is(".disabled")) e.preventDefault();
      });

      $mySelectBuyButton.off().on("click", function (e) {
        let $this = $(this);
        if ($this.is(".disabled")) e.preventDefault();
      });
    },

    onpageshow() {
      $(window).on("popstate", function (e) {
        setTimeout(function () {
          isOnpageshow = true;
          urlParamsObj = getUrlParams();
          optionSelectFiltering("init");
        }, 0);
      });
    },
  };

  return { init };
};

buying().init();
