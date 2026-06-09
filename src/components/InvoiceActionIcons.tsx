import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Polyline } from 'react-native-svg';

/** Exact path from user-provided Whatsapp-color SVG */
const WHATSAPP_PATH =
  'M723.993033,360 C710.762252,360 700,370.765287 700,383.999801 C700,389.248451 701.692661,394.116025 704.570026,398.066947 L701.579605,406.983798 L710.804449,404.035539 C714.598605,406.546975 719.126434,408 724.006967,408 C737.237748,408 748,397.234315 748,384.000199 C748,370.765685 737.237748,360.000398 724.006967,360.000398 L723.993033,360.000398 L723.993033,360 Z M717.29285,372.190836 C716.827488,371.07628 716.474784,371.034071 715.769774,371.005401 C715.529728,370.991464 715.262214,370.977527 714.96564,370.977527 C714.04845,370.977527 713.089462,371.245514 712.511043,371.838033 C711.806033,372.557577 710.056843,374.23638 710.056843,377.679202 C710.056843,381.122023 712.567571,384.451756 712.905944,384.917648 C713.258648,385.382743 717.800808,392.55031 724.853297,395.471492 C730.368379,397.757149 732.00491,397.545307 733.260074,397.27732 C735.093658,396.882308 737.393002,395.527239 737.971421,393.891043 C738.54984,392.25405 738.54984,390.857171 738.380255,390.560912 C738.211068,390.264652 737.745308,390.095816 737.040298,389.742615 C736.335288,389.389811 732.90737,387.696673 732.25849,387.470894 C731.623543,387.231179 731.017259,387.315995 730.537963,387.99333 C729.860819,388.938653 729.198006,389.89831 728.661785,390.476494 C728.238619,390.928051 727.547144,390.984595 726.969123,390.744481 C726.193254,390.420348 724.021298,389.657798 721.340985,387.273388 C719.267356,385.42535 717.856938,383.125756 717.448104,382.434484 C717.038871,381.729275 717.405907,381.319529 717.729948,380.938852 C718.082653,380.501232 718.421026,380.191036 718.77373,379.781688 C719.126434,379.372738 719.323884,379.160897 719.549599,378.681068 C719.789645,378.215575 719.62006,377.735746 719.450874,377.382942 C719.281687,377.030139 717.871269,373.587317 717.29285,372.190836 Z';

const WHATSAPP_GREEN = '#67C15E';

type IconProps = {
  size?: number;
};

/** User-provided download-alt-3 SVG (Flat Line) */
export function InvoiceDownloadIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21,13v7a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V13H8a4,4,0,0,0,8,0Z"
        fill="#2e80ea"
      />
      <Polyline
        points="9 8 12 11 15 8"
        fill="none"
        stroke="#2e80ea"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21,13,18.23,4.68A1,1,0,0,0,17.28,4H16"
        fill="none"
        stroke="#2e80ea"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8,4H6.72a1,1,0,0,0-1,.68L3,13"
        fill="none"
        stroke="#2e80ea"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12,3v8m4,2a4,4,0,0,1-8,0H3v7a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V13Z"
        fill="none"
        stroke="#2e80ea"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * User-provided Whatsapp-color SVG.
 * Uses the original translate(-700, -360) + path so the graphic maps to a clean 48×48 viewBox.
 */
export function InvoiceWhatsAppIcon({ size = 30 }: IconProps) {
  return (
    <View style={[iconStyles.slot, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <G transform="translate(-700, -360)">
          <Path fill={WHATSAPP_GREEN} fillRule="evenodd" d={WHATSAPP_PATH} />
        </G>
      </Svg>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
