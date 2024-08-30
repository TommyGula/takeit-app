import React, { useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, ScrollView, Dimensions } from "react-native";
import { styles } from "../styles/global";

const ScrollViewContainer = ({ children, selected, style }) => {
    const [scrollHeight, setScrollHeight] = useState(0);
    const [onLayoutSet, setOnLayoutSet] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        handleLayout();
    }, [scrollRef]);

    useFocusEffect(
        React.useCallback(() => {
          if (selected && selected.pageY) {
            scrollRef.current.scrollTo({ y: selected.pageY, animated: true })
          }
        },[selected])
      );

    const handleLayout = (e=null) => {
        if (e) setOnLayoutSet(true);
        if (scrollRef && scrollRef.current) {
            scrollRef.current.measureInWindow((x, y, width, height) => {
              const windowHeight = Dimensions.get('window').height;
              const visibleHeight = Math.max(0, Math.min(height, windowHeight - y));
              setScrollHeight(visibleHeight);
            })
        };
    };

    return(
        <View style={[styles.scrollViewContainer, {height:(scrollHeight || 'auto')}]}>
            <ScrollView ref={scrollRef} onLayout={!onLayoutSet ? handleLayout : () => null} vertical showsVerticalScrollIndicator={true} style={[styles.scrollView, style]}>
                {children}
            </ScrollView>
        </View>
    )
};

export default ScrollViewContainer;